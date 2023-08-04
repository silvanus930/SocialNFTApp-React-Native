package com.persona.personaalpha.model

data class ChannelModel(
    val name: String? = null,
    val profileImgUrl: String? = null,
    val members: List<String>? = null,
    val private: Boolean? = null,
    var fiveUsers: List<UserModel>? = null
)
