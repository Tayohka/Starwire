package com.limelight.preferences;

import static org.junit.Assert.assertEquals;

import android.app.Application;
import android.preference.PreferenceManager;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

/**
 * The Sharpening slider in Settings under Video: what the Vulkan renderer gets
 * is the number the slider saved, and a fresh install starts at 0, off.
 * Each test sets the value first, so they don't depend on running order.
 */
@RunWith(RobolectricTestRunner.class)
// PreferenceConfiguration reaches MoonBridge, which loads the native streaming library in its
// static block. Instrumenting it lets Robolectric skip loadLibrary and stub the native calls.
@Config(sdk = 36, instrumentedPackages = {"com.limelight.nvstream.jni"})
public class SharpeningSettingTest {
    private final Application context = RuntimeEnvironment.getApplication();

    private PreferenceConfiguration readWithSharpening(Integer percent) {
        if (percent == null) {
            PreferenceManager.getDefaultSharedPreferences(context).edit()
                    .remove("seekbar_sharpening").commit();
        }
        else {
            PreferenceManager.getDefaultSharedPreferences(context).edit()
                    .putInt("seekbar_sharpening", percent).commit();
        }
        return PreferenceConfiguration.readPreferences(context);
    }

    @Test
    public void sharpeningDefaultsToOff() {
        assertEquals(0, readWithSharpening(null).sharpening);
    }

    @Test
    public void sharpeningReadsTheSavedValue() {
        assertEquals(75, readWithSharpening(75).sharpening);
        assertEquals(5, readWithSharpening(5).sharpening);
        assertEquals(100, readWithSharpening(100).sharpening);
    }

    // A value saved some other way can't push sharpening past either end
    @Test
    public void sharpeningClampsOutOfRangeValues() {
        assertEquals(0, readWithSharpening(-1).sharpening);
        assertEquals(100, readWithSharpening(101).sharpening);
    }

    // The in-stream slider saves what it set, so the next stream starts with it
    @Test
    public void sharpeningSavesTheLiveValue() {
        PreferenceConfiguration.setSharpening(context, 60);
        assertEquals(60, PreferenceConfiguration.readPreferences(context).sharpening);
    }

    @Test
    public void sharpeningSaveClampsOutOfRangeValues() {
        PreferenceConfiguration.setSharpening(context, -5);
        assertEquals(0, PreferenceConfiguration.readPreferences(context).sharpening);
        PreferenceConfiguration.setSharpening(context, 150);
        assertEquals(100, PreferenceConfiguration.readPreferences(context).sharpening);
    }
}
