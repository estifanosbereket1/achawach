use biquad::{Biquad, Coefficients, DirectForm1, Hertz, Type};
use rodio::{ChannelCount, SampleRate, Source};
use std::sync::{Arc, Mutex};
use std::time::Duration;

pub const NUM_BANDS: usize = 10;
pub const BAND_FREQUENCIES: [f32; NUM_BANDS] =
    [31.0, 62.0, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0];
const EQ_Q: f32 = 1.0;

pub type EqGains = Arc<Mutex<[f32; NUM_BANDS]>>;

pub fn new_eq_gains() -> EqGains {
    Arc::new(Mutex::new([0.0; NUM_BANDS]))
}

fn identity_coefficients() -> Coefficients<f32> {
    Coefficients {
        b0: 1.0,
        b1: 0.0,
        b2: 0.0,
        a1: 0.0,
        a2: 0.0,
    }
}

fn band_coefficients(sample_rate: f32, band: usize, gain_db: f32) -> Coefficients<f32> {
    if gain_db == 0.0 {
        return identity_coefficients();
    }
    let Ok(fs) = Hertz::<f32>::from_hz(sample_rate) else {
        return identity_coefficients();
    };
    let Ok(f0) = Hertz::<f32>::from_hz(BAND_FREQUENCIES[band]) else {
        return identity_coefficients();
    };
    Coefficients::<f32>::from_params(Type::PeakingEQ(gain_db), fs, f0, EQ_Q)
        .unwrap_or_else(|_| identity_coefficients())
}

/// Wraps a decoded audio `Source` with a 10-band graphic EQ: for each
/// channel, a cascade of peaking biquad filters (one per band). Samples are
/// interleaved (L,R,L,R,...), so each channel needs its own filter state -
/// mixing them would corrupt the filters' memory across channels.
pub struct EqSource<S: Source<Item = f32>> {
    inner: S,
    channel_filters: Vec<[DirectForm1<f32>; NUM_BANDS]>,
    channel_index: usize,
    gains: EqGains,
    applied_gains: [f32; NUM_BANDS],
    sample_rate: f32,
}

impl<S: Source<Item = f32>> EqSource<S> {
    pub fn new(inner: S, gains: EqGains) -> Self {
        let channels = inner.channels().get() as usize;
        let sample_rate = inner.sample_rate().get() as f32;
        let applied_gains = *gains.lock().unwrap();

        let channel_filters = (0..channels.max(1))
            .map(|_| {
                std::array::from_fn(|band| {
                    DirectForm1::<f32>::new(band_coefficients(sample_rate, band, applied_gains[band]))
                })
            })
            .collect();

        Self {
            inner,
            channel_filters,
            channel_index: 0,
            gains,
            applied_gains,
            sample_rate,
        }
    }

    fn sync_gains(&mut self) {
        let current = *self.gains.lock().unwrap();
        if current == self.applied_gains {
            return;
        }
        for filters in &mut self.channel_filters {
            for (band, filter) in filters.iter_mut().enumerate() {
                if current[band] != self.applied_gains[band] {
                    filter.update_coefficients(band_coefficients(self.sample_rate, band, current[band]));
                }
            }
        }
        self.applied_gains = current;
    }
}

impl<S: Source<Item = f32>> Iterator for EqSource<S> {
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        self.sync_gains();
        let sample = self.inner.next()?;
        let filters = self.channel_filters.get_mut(self.channel_index)?;
        let filtered = filters.iter_mut().fold(sample, |acc, band| band.run(acc));

        let channels = self.channel_filters.len().max(1);
        self.channel_index = (self.channel_index + 1) % channels;
        Some(filtered)
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.inner.size_hint()
    }
}

impl<S: Source<Item = f32>> Source for EqSource<S> {
    fn current_span_len(&self) -> Option<usize> {
        self.inner.current_span_len()
    }

    fn channels(&self) -> ChannelCount {
        self.inner.channels()
    }

    fn sample_rate(&self) -> SampleRate {
        self.inner.sample_rate()
    }

    fn total_duration(&self) -> Option<Duration> {
        self.inner.total_duration()
    }

    fn try_seek(&mut self, pos: Duration) -> Result<(), rodio::source::SeekError> {
        self.inner.try_seek(pos)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestSource {
        samples: Vec<f32>,
        index: usize,
        channels: u16,
        sample_rate: u32,
    }

    impl Iterator for TestSource {
        type Item = f32;
        fn next(&mut self) -> Option<f32> {
            let s = self.samples.get(self.index).copied();
            self.index += 1;
            s
        }
    }

    impl Source for TestSource {
        fn current_span_len(&self) -> Option<usize> {
            None
        }
        fn channels(&self) -> ChannelCount {
            ChannelCount::new(self.channels).unwrap()
        }
        fn sample_rate(&self) -> SampleRate {
            SampleRate::new(self.sample_rate).unwrap()
        }
        fn total_duration(&self) -> Option<Duration> {
            None
        }
    }

    #[test]
    fn zero_gain_is_exact_passthrough() {
        let samples = vec![0.1, -0.2, 0.3, -0.4, 0.5];
        let src = TestSource {
            samples: samples.clone(),
            index: 0,
            channels: 1,
            sample_rate: 44100,
        };
        let eq = EqSource::new(src, new_eq_gains());
        let output: Vec<f32> = eq.collect();
        assert_eq!(output, samples);
    }

    #[test]
    fn nonzero_gain_actually_filters_the_signal() {
        let samples: Vec<f32> = (0..200).map(|i| (i as f32 * 0.1).sin()).collect();
        let src = TestSource {
            samples: samples.clone(),
            index: 0,
            channels: 1,
            sample_rate: 44100,
        };
        let gains = new_eq_gains();
        *gains.lock().unwrap() = [6.0; NUM_BANDS];
        let eq = EqSource::new(src, gains);
        let output: Vec<f32> = eq.collect();
        assert_ne!(output, samples, "a nonzero band gain should audibly change the signal");
    }

    #[test]
    fn stereo_channels_are_filtered_independently() {
        // Interleaved L/R: an impulse on L at t=0, R held at silence throughout.
        let mut samples = vec![0.0f32; 40];
        samples[0] = 1.0;
        let src = TestSource {
            samples: samples.clone(),
            index: 0,
            channels: 2,
            sample_rate: 44100,
        };
        let gains = new_eq_gains();
        *gains.lock().unwrap() = [6.0; NUM_BANDS];
        let eq = EqSource::new(src, gains);
        let output: Vec<f32> = eq.collect();

        let left: Vec<f32> = output.iter().step_by(2).copied().collect();
        let right: Vec<f32> = output.iter().skip(1).step_by(2).copied().collect();

        assert!(
            right.iter().all(|&x| x == 0.0),
            "R channel got only silence and must stay silent, got {right:?}"
        );
        assert!(
            left.iter().any(|&x| x != 0.0),
            "L channel's impulse should produce a nontrivial filtered response"
        );
    }
}
