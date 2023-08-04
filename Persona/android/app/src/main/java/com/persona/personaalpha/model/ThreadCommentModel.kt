package com.persona.personaalpha.model

import com.google.firebase.Timestamp

data class ThreadCommentModel(
    val deleted: Boolean? = null,
    val isThread: Boolean? = null,
    val text: String? = null,
    val timestamp: Timestamp? = null,
    val userID: String? = null
)
