package com.persona.personaalpha.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView.ViewHolder
import com.bumptech.glide.Glide
import com.google.android.material.imageview.ShapeableImageView
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.ktx.Firebase
import com.persona.personaalpha.R
import com.persona.personaalpha.databinding.EmptyLayoutBinding
import com.persona.personaalpha.databinding.PostItemBinding
import com.persona.personaalpha.databinding.SimpleChatItemBinding
import com.persona.personaalpha.model.ChatModel
import com.persona.personaalpha.model.PersonaModel
import com.persona.personaalpha.model.UserModel
import com.persona.personaalpha.utils.getTimeFromMillis
import java.util.*

class ChatAdapter : ListAdapter<ChatModel, ViewHolder>(DiffCallback()) {

    private lateinit var mContext: Context
    private val currentUserId: String? = Firebase.auth.currentUser?.providerData?.get(0)?.uid

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        mContext = parent.context
        return when (viewType) {
            0 -> SimpleChatViewHolder(
                SimpleChatItemBinding.inflate(
                    LayoutInflater.from(parent.context), parent, false
                )
            )
            1 -> PostChatViewHolder(
                PostItemBinding.inflate(
                    LayoutInflater.from(parent.context), parent, false
                )
            )
            2 -> EmptyChatViewHolder(
                EmptyLayoutBinding.inflate(
                    LayoutInflater.from(parent.context), parent, false
                )
            )
            else -> OtherChatViewHolder(
                PostItemBinding.inflate(
                    LayoutInflater.from(parent.context), parent, false
                )
            )
        }
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
//        holder.setIsRecyclable(false)
        when (holder) {
            is SimpleChatViewHolder -> holder.bindTo(getItem(position))
            is PostChatViewHolder -> holder.bindTo(getItem(position))
            is EmptyChatViewHolder -> holder.bindTo(getItem(position))
            is OtherChatViewHolder -> holder.bindTo(getItem(position))
        }
    }

    inner class PostChatViewHolder(private val binding: PostItemBinding) :
        ViewHolder(binding.root) {
        fun bindTo(item: ChatModel) {
            with(binding) {
                item.post?.data?.entityID?.let { id ->
                    FirebaseFirestore
                        .getInstance()
                        .collection("personas")
                        .document(id)
                        .get()
                        .addOnSuccessListener {
                            val persona = it.toObject(PersonaModel::class.java)
                            Glide.with(mContext).load(persona?.profileImgUrl)
                                .placeholder(ContextCompat.getDrawable(mContext, R.drawable.bg))
                                .into(personaAvatar)
                            personaName.text = persona?.name ?: ""
                        }
                }
                title.text = item.post?.data?.title ?: ""
                postMessageText.text = item.post?.data?.text ?: ""
                postByText.text =
                    mContext.getString(R.string.post_by).format(item.post?.data?.userName ?: "")
            }
        }
    }

    inner class EmptyChatViewHolder(private val binding: EmptyLayoutBinding) :
        ViewHolder(binding.root) {
        fun bindTo(item: ChatModel) {

        }
    }

    inner class OtherChatViewHolder(private val binding: PostItemBinding) :
        ViewHolder(binding.root) {
        fun bindTo(item: ChatModel) {
            itemView.isVisible = false
        }
    }

    inner class SimpleChatViewHolder(private val binding: SimpleChatItemBinding) :
        ViewHolder(binding.root) {

        fun bindTo(item: ChatModel) {
            with(binding) {
                if (item.postStartDate != null) {
                    dateText.text = item.postStartDate
                    dateLayout.isVisible = true
                }
                item.userID?.let { userId ->
                    FirebaseFirestore
                        .getInstance()
                        .collection("users")
                        .document(userId)
                        .get()
                        .addOnSuccessListener {
                            item.user = it.toObject(UserModel::class.java)
                            Glide.with(mContext).load(item.user?.profileImgUrl)
                                .placeholder(ContextCompat.getDrawable(mContext, R.drawable.bg))
                                .into(avatar)
                            if (item.postTime == null) {
                                avatar.isVisible = true
                                messageText.text = item.text
                                messageLayout.isVisible = true
                            } else {
                                avatar.isVisible = true
                                usernameText.text = "%s - %s".format(
                                    item.user?.userName, item.postTime
                                ).lowercase()
                                messageText.text = item.text
                                usernameText.isVisible = true
                                messageLayout.isVisible = true
                            }
                        }
                }
                if (item.endorsements != null) {
                    addSmiles(item.endorsements, smilesLayout)
                } else {
                    smilesLayout.removeAllViews()
                    smilesLayout.isVisible = false
                }
                if (
                    item.latestThreadComment != null &&
                    item.latestThreadComment?.deleted == false
                ) {
                    replyMainLayout.isVisible = true
                    item.latestThreadComment?.userID?.let { userId ->
                        FirebaseFirestore
                            .getInstance()
                            .collection("users")
                            .document(userId)
                            .get()
                            .addOnSuccessListener {
                                val user = it.toObject(UserModel::class.java)
                                val c = Calendar.getInstance()
                                Glide.with(mContext).load(user?.profileImgUrl)
                                    .into(binding.replierAvatar)
                                item.latestThreadComment?.timestamp?.seconds?.let { seconds ->
                                    when (val passedTime =
                                        ((c.timeInMillis - seconds * 1000) / 86400000).toInt()) {
                                        0 -> replierUsername.text =
                                            mContext.getString(R.string.reply_date).format(
                                                user?.userName ?: "",
                                                getTimeFromMillis(seconds * 1000)
                                            )
                                        in 1..30 -> replierUsername.text =
                                            mContext.getString(R.string.reply_date_d).format(
                                                user?.userName ?: "", passedTime
                                            )
                                        in 31..365 -> replierUsername.text =
                                            mContext.getString(R.string.reply_date_m).format(
                                                user?.userName ?: "", passedTime / 30
                                            )
                                        else -> replierUsername.text =
                                            mContext.getString(R.string.reply_date_y).format(
                                                user?.userName ?: "", passedTime / 365
                                            )
                                    }
                                }
                            }
                    }
                    replierMessage.text = item.latestThreadComment?.text ?: ""
                    viewReplies.text =
                        mContext.getString(R.string.view_replies).format(item.numThreadComments)
                    replyMainLayout.setOnClickListener {
                        onReplyClick(binding, item.document ?: "")
                    }
                } else {
                    replyMainLayout.isVisible = false
                }
            }
        }
    }

    override fun getItemViewType(position: Int): Int =
        when (getItem(position).messageType) {
            null -> 0
            "post" -> 1
            "empty" -> 2
            else -> 3
        }

    private fun addSmiles(endorsements: Map<String, List<String>>, layout: LinearLayout) {
        layout.removeAllViews()
        endorsements.keys.forEach {
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 0, 18, 0)
            }
            AppCompatTextView(mContext).apply {
                layoutParams = params
                text = "%s %s".format(it, endorsements[it]?.size)
                background = ContextCompat.getDrawable(mContext, R.drawable.chat_smile_bg)
                setPadding(14, 12, 14, 12)
            }.also { view ->
                layout.addView(view)
            }
        }
        layout.isVisible = true
    }

    private fun onReplyClick(binding: SimpleChatItemBinding, documentId: String) {
        with(binding) {
            replyMainLayout.isVisible = false
            FirebaseFirestore
                .getInstance()
                .collection("communities")
                .document("personateam")
                .collection("chat")
                .document("all")
                .collection("messages")
                .document(documentId)
                .collection("threads")
                .orderBy("timestamp", Query.Direction.ASCENDING)
                .get()
                .addOnSuccessListener {
                    repliesLayout.removeAllViews()
                    val inflater = LayoutInflater.from(mContext)
                    it.toObjects(ChatModel::class.java).forEachIndexed { index, item ->
                        val view =
                            inflater.inflate(R.layout.reply_item, repliesLayout, false)
                        view.id = index
                        repliesLayout.addView(view)
                        item.userID?.let { userId ->
                            FirebaseFirestore
                                .getInstance()
                                .collection("users")
                                .document(userId)
                                .get()
                                .addOnSuccessListener { snapshot ->
                                    val user = snapshot.toObject(UserModel::class.java)
                                    view.findViewById<AppCompatTextView>(R.id.replyMessageText)
                                        .apply {
                                            text = item.text
                                            isVisible = true
                                        }
                                    view.findViewById<ShapeableImageView>(R.id.repliersAvatar)
                                        .apply {
                                            Glide.with(mContext)
                                                .load(user?.profileImgUrl)
                                                .placeholder(
                                                    ContextCompat.getDrawable(
                                                        mContext,
                                                        R.drawable.bg
                                                    )
                                                )
                                                .into(this)
                                            isVisible = true
                                        }
                                    view.findViewById<AppCompatTextView>(R.id.replyUsernameText)
                                        .apply {
                                            text = mContext.getString(R.string.reply_date)
                                                .format(
                                                    user?.userName ?: "",
                                                    item.timestamp?.seconds?.let { seconds ->
                                                        getTimeFromMillis(
                                                            seconds * 1000
                                                        )
                                                    }
                                                ).lowercase()
                                            isVisible = true
                                        }
                                    if (item.endorsements != null) {
                                        addSmiles(
                                            item.endorsements,
                                            view.findViewById(R.id.repliedSmilesLayout)
                                        )
                                    } else {
                                        view.findViewById<LinearLayout>(R.id.repliedSmilesLayout).isVisible =
                                            false
                                    }
                                }
                        }
                    }
                }
        }
    }

    private class DiffCallback : DiffUtil.ItemCallback<ChatModel>() {
        override fun areItemsTheSame(
            oldItem: ChatModel, newItem: ChatModel
        ): Boolean = oldItem == newItem

        override fun areContentsTheSame(
            oldItem: ChatModel, newItem: ChatModel
        ): Boolean = oldItem == newItem
    }
}