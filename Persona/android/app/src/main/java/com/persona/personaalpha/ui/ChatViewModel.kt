package com.persona.personaalpha.ui

import androidx.lifecycle.ViewModel
import com.persona.personaalpha.model.ChannelModel
import com.persona.personaalpha.model.ChatModel
import com.persona.personaalpha.model.PersonaModel
import com.persona.personaalpha.model.UserModel
import com.persona.personaalpha.utils.countPassedTime
import com.persona.personaalpha.utils.getDateFromMillis
import com.persona.personaalpha.utils.getTimeFromMillis
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.*

class ChatViewModel : ViewModel() {

    private var auth: FirebaseAuth = Firebase.auth

    private val _errorMsg: MutableStateFlow<String?> by lazy { MutableStateFlow(null) }
    val errorMsg = _errorMsg.asStateFlow()

    private val _resultData: MutableStateFlow<List<ChatModel>?> by lazy {
        MutableStateFlow(
            null
        )
    }
    val resultData = _resultData.asStateFlow()

    private val _channelData: MutableStateFlow<ChannelModel?> by lazy { MutableStateFlow(null) }
    val channelData = _channelData.asStateFlow()

    private val allUsers = mutableMapOf<String, UserModel>()
    private val allPersonas = mutableMapOf<String, PersonaModel>()
    private val allChat = mutableListOf<ChatModel>()

    init {
        if (auth.currentUser != null) {
            getAllUsers()
        } else {
            signIn()
        }
    }

    private fun signIn() {
        auth.signInWithEmailAndPassword(
            "artur.karapetyan@rocketmail.com", "kabrutsze?1"
        ).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                getAllUsers()
            } else {
                _errorMsg.value = "Authentication failed"
            }
        }
    }

    private fun getCommunityData() {
        FirebaseFirestore
            .getInstance()
            .collection("communities")
            .document("personateam")
            .get()
            .addOnSuccessListener {
                it.toObject(ChannelModel::class.java)?.let { item ->
                    val fiveUsers = mutableListOf<UserModel>()
                    item.members?.let { members ->
                        if (members.size >= 5) {
                            for (i in 0..4) {
                                allUsers[members[i]]?.let { member ->
                                    fiveUsers.add(member)
                                }
                            }
                            item.fiveUsers = fiveUsers
                        }
                    }
                    _channelData.value = item
                    getAllPersonas()
                }
            }
    }

    private fun getAllUsers() {
        FirebaseFirestore
            .getInstance()
            .collection("users")
            .get()
            .addOnSuccessListener { query ->
                query.documents.forEachIndexed { index, document ->
                    query.documents[index].toObject(UserModel::class.java)?.let { user ->
                        if (user.human != null)
                            allUsers[document.id] = user
                    }
                }
                getCommunityData()
            }
    }

    private fun getAllPersonas() {
        FirebaseFirestore
            .getInstance()
            .collection("personas")
            .get()
            .addOnSuccessListener { query ->
                query.documents.forEachIndexed { index, document ->
                    query.documents[index].toObject(PersonaModel::class.java)?.let { persona ->
                        if (persona.deleted != null && persona.deleted != true)
                            allPersonas[document.id] = persona
                    }
                }
                getAllChat()
            }
    }

    private fun getAllChat() {
        FirebaseFirestore
            .getInstance()
            .collection("communities")
            .document("personateam")
            .collection("chat")
            .document("all")
            .collection("messages")
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .get()
            .addOnSuccessListener { query ->
                val c = Calendar.getInstance()
                var lastPostDay: String? = null
                var lastUserId: String? = null
                var lastPostTime = -1L

                query.documents.forEachIndexed { index, document ->
                    query.documents[index].toObject(ChatModel::class.java)?.let { item ->
                        if (item.deleted != null && item.deleted != true)
                            item.user = allUsers[item.userID]
                        if (item.userID == Firebase.auth.currentUser?.providerData?.get(0)?.uid) {
                            item.messageType = "owner"
                        }
                        if (
                            item.latestThreadComment != null &&
                            item.latestThreadComment?.deleted == false
                        ) {
                            item.latestCommentUser = allUsers[item.latestThreadComment?.userID]
                            item.latestThreadComment?.timestamp?.seconds?.let { seconds ->
                                item.replierTitle =
                                    "%s - %s".format(
                                        item.latestCommentUser?.userName ?: "",
                                        countPassedTime(seconds * 1000)
                                    )
                            }
                        }
                        if (item.replyComment != null) {
                            item.replyComment?.user = allUsers[item.replyComment?.userID]
                            item.replyComment?.timestamp?.seconds?.let { seconds ->
                                item.replyComment?.replyToTitle = "%s - %s".format(
                                    item.replyComment?.user?.userName ?: "",
                                    countPassedTime(seconds * 1000)
                                )
                            }
                        }
                        item.timestamp?.seconds?.let { millis ->
                            val date = getDateFromMillis(millis * 1000)
                            if (lastPostDay != date.day) {
                                item.postStartDate = "%s %s %s".format(
                                    date.month, date.day, date.year
                                )
                            }
                            if (!(lastUserId == item.userID && ((millis - lastPostTime) < 60))) {
                                item.postTime = getTimeFromMillis(millis * 1000)
                            }
                            lastPostDay = date.day
                            lastUserId = item.userID
                            lastPostTime = item.timestamp.seconds
                        }
                        item.document = document.id
                        item.post?.data?.entityID?.let { id ->
                            item.persona = allPersonas[id]
                        }
                        allChat.add(item)
                    }
                }
                _resultData.value = allChat
            }
    }
}