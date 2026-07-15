package com.infro.app

import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.*
import com.infro.app.model.AnalysisSettings

class SettingsBottomSheet(
    context: Context,
    private val settings: AnalysisSettings,
    private val onApply: (AnalysisSettings) -> Unit
) : Dialog(context, R.style.SettingsSheet) {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.sheet_settings)

        window?.apply {
            setGravity(Gravity.BOTTOM)
            setBackgroundDrawableResource(android.R.color.transparent)
            setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT)
            setWindowAnimations(R.style.SheetAnimation)
        }

        val tvThreshold = findViewById<TextView>(R.id.tvThreshold)
        val sliderThreshold = findViewById<SeekBar>(R.id.sliderThreshold)
        val tvMinDur = findViewById<TextView>(R.id.tvMinDur)
        val sliderMinDur = findViewById<SeekBar>(R.id.sliderMinDur)
        val tvMaxGap = findViewById<TextView>(R.id.tvMaxGap)
        val sliderMaxGap = findViewById<SeekBar>(R.id.sliderMaxGap)
        val tvDensity = findViewById<TextView>(R.id.tvDensity)
        val sliderDensity = findViewById<SeekBar>(R.id.sliderDensity)
        val tvFrameRate = findViewById<TextView>(R.id.tvFrameRate)
        val sliderFrameRate = findViewById<SeekBar>(R.id.sliderFrameRate)
        val tvAudioRate = findViewById<TextView>(R.id.tvAudioRate)
        val sliderAudioRate = findViewById<SeekBar>(R.id.sliderAudioRate)
        val btnApply = findViewById<Button>(R.id.btnApply)

        // Setup sliders
        sliderThreshold.max = 28 // 70-98
        sliderThreshold.progress = settings.similarityThreshold - 70
        tvThreshold.text = "${settings.similarityThreshold}%"
        sliderThreshold.setOnSeekBarChangeListener(simpleListener { v ->
            settings.similarityThreshold = v + 70
            tvThreshold.text = "${v + 70}%"
        })

        sliderMinDur.max = 28 // 2-30
        sliderMinDur.progress = settings.minMatchDuration - 2
        tvMinDur.text = "${settings.minMatchDuration}s"
        sliderMinDur.setOnSeekBarChangeListener(simpleListener { v ->
            settings.minMatchDuration = v + 2
            tvMinDur.text = "${v + 2}s"
        })

        sliderMaxGap.max = 27 // 0.3-3.0 (step 0.1)
        sliderMaxGap.progress = ((settings.maxGap - 0.3) * 10).toInt()
        tvMaxGap.text = "${settings.maxGap}s"
        sliderMaxGap.setOnSeekBarChangeListener(simpleListener { v ->
            settings.maxGap = (v + 3) / 10.0
            tvMaxGap.text = "%.1fs".format(settings.maxGap)
        })

        sliderDensity.max = 13 // 30-95 step 5
        sliderDensity.progress = (settings.matchDensity - 30) / 5
        tvDensity.text = "${(settings.matchDensity * 100).toInt()}%"
        sliderDensity.setOnSeekBarChangeListener(simpleListener { v ->
            settings.matchDensity = (v * 5 + 30) / 100.0
            tvDensity.text = "${v * 5 + 30}%"
        })

        sliderFrameRate.max = 5 // 1-6
        sliderFrameRate.progress = settings.frameSampleRate - 1
        tvFrameRate.text = "${settings.frameSampleRate} fps"
        sliderFrameRate.setOnSeekBarChangeListener(simpleListener { v ->
            settings.frameSampleRate = v + 1
            tvFrameRate.text = "${v + 1} fps"
        })

        sliderAudioRate.max = 20 // 8-48 step 2
        sliderAudioRate.progress = (settings.audioSampleRate - 8) / 2
        tvAudioRate.text = "${settings.audioSampleRate} kHz"
        sliderAudioRate.setOnSeekBarChangeListener(simpleListener { v ->
            settings.audioSampleRate = v * 2 + 8
            tvAudioRate.text = "${v * 2 + 8} kHz"
        })

        btnApply.setOnClickListener {
            onApply(settings)
            dismiss()
        }
    }

    private fun simpleListener(onChange: (Int) -> Unit) =
        object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) onChange(progress)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        }
}
