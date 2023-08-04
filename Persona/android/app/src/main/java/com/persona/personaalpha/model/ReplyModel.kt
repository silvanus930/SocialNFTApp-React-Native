package com.persona.personaalpha.model

import com.google.firebase.Timestamp

data class ReplyModel(
    val id: String? = null,
    val replyId: String? = null,
    val text: String? = null,
    val userID: String? = null,
    var user: UserModel? = null,
    val deleted: Boolean? = null,
    var replyToTitle: String? = null,
    var timestamp: Timestamp? = null
)
