package com.persona.personaalpha.model

import com.google.firebase.Timestamp

data class ChatModel(
    val endorsements: Map<String, List<String>>? = null,
    var messageType: String? = null,
    val deleted: Boolean? = null,
    val text: String? = null,
    val timestamp: Timestamp? = null,
    val userID: String? = null,
    var postStartDate: String? = null,
    var postTime: String? = null,
    var user: UserModel? = null,
    var latestCommentUser: UserModel? = null,
    var replierTitle: String? = null,
    var numThreadComments: Int? = null,
    var latestThreadComment: ThreadCommentModel? = null,
    var document: String? = null,
    var post: PostModel? = null,
    var persona: PersonaModel? = null,
    var replyComment: ReplyModel? = null
)
