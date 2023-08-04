package com.persona.personaalpha.utils

import android.content.Context
import android.widget.Toast
import com.persona.personaalpha.model.DateModel
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

fun showToast(context: Context, msg: String) {
    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
}

fun getTimeFromMillis(millis: Long): String =
    SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(millis))

fun getDateFromMillis(millis: Long): DateModel = DateModel(
    day = SimpleDateFormat("d", Locale.getDefault()).format(Date(millis)),
    month = SimpleDateFormat("M", Locale.getDefault()).format(Date(millis)).run {
        getMonthName(this)
    },
    year = SimpleDateFormat("yyyy", Locale.getDefault()).format(Date(millis))
)

private fun getMonthName(month: String): String = when (month) {
    "1" -> "January"
    "2" -> "February"
    "3" -> "March"
    "4" -> "April"
    "5" -> "May"
    "6" -> "June"
    "7" -> "July"
    "8" -> "August"
    "9" -> "September"
    "10" -> "October"
    "11" -> "November"
    "12" -> "December"
    else -> ""
}

fun countPassedTime(millis: Long): String {

    val seconds = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis() - millis)
    val minutes = TimeUnit.MILLISECONDS.toMinutes(System.currentTimeMillis() - millis)
    val hours = TimeUnit.MILLISECONDS.toHours(System.currentTimeMillis() - millis)
    val days = TimeUnit.MILLISECONDS.toDays(System.currentTimeMillis() - millis)

    return if (days in 1..6) {
        "${days}d"
    } else if (days in 7..31) {
        return "${days / 7}w"
    } else if (days == 0L) {
        if (hours > 0) {
            "${hours}h"
        } else {
            if (minutes > 0) {
                "${minutes}m"
            } else {
                "${seconds}s"
            }
        }
    } else {
        // do it for month and years
        return ""
    }
}
