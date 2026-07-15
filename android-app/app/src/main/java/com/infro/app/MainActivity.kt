package com.infro.app

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        findViewById<LinearLayout>(R.id.cardCompare).setOnClickListener {
            startActivity(Intent(this, CompareActivity::class.java))
        }

        findViewById<LinearLayout>(R.id.cardDetect).setOnClickListener {
            startActivity(Intent(this, DetectActivity::class.java))
        }
    }
}
