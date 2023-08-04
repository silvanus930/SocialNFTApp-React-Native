package com.persona.personaalpha.ui

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.isVisible
import androidx.core.view.updateLayoutParams
import androidx.fragment.app.Fragment
import androidx.lifecycle.flowWithLifecycle
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.persona.personaalpha.utils.showToast
import com.persona.personaalpha.R
import com.persona.personaalpha.adapter.ChatAdapter
import com.persona.personaalpha.databinding.FragmentChatBinding
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import org.koin.androidx.viewmodel.ext.android.viewModel

class ChatFragment : Fragment() {

    private lateinit var binding: FragmentChatBinding
    private val viewModel: ChatViewModel by viewModel()
    private lateinit var mContext: Context
    private lateinit var chatAdapter: ChatAdapter

    override fun onAttach(context: Context) {
        super.onAttach(context)
        mContext = context
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        binding = FragmentChatBinding.inflate(layoutInflater)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        setSystemButtonsSettings()
        onFlow()
        initAdapter()
    }

    private fun setSystemButtonsSettings() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.sendMessageLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.updateLayoutParams<ViewGroup.MarginLayoutParams> {
                bottomMargin = insets.bottom
            }
            WindowInsetsCompat.CONSUMED
        }
    }

    private fun initAdapter() {
        val chatLayoutManager = LinearLayoutManager(mContext).apply {
            orientation = LinearLayoutManager.VERTICAL
//            reverseLayout = true
//            stackFromEnd = true

        }

        chatAdapter = ChatAdapter()
        binding.recycler.apply {
            layoutManager = chatLayoutManager
            adapter = chatAdapter
            addOnScrollListener(object : RecyclerView.OnScrollListener() {
                override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                    super.onScrolled(recyclerView, dx, dy)

//                    if(dy<0){
//                        Log.d("TAG", "UP")
//                    } else {
//                        Log.d("TAG", "DOWN")
//                    }
//                    if(chatLayoutManager.findFirstVisibleItemPosition() == chatLayoutManager.itemCount-1){
//                        Log.d("TAG", "We ha reach end")
//                    }
                    if (!recyclerView.canScrollVertically(1)) {
                        Log.d("TAG", "We have reach end")
                    } else {
                        Log.d("TAG", "We have not reach end")
                    }
                }
            })
        }
    }

    private fun onFlow() {
        collectFlow(viewModel.resultData) {
            chatAdapter.submitList(it)
            binding.recycler.scrollToPosition(it.size - 1)
        }

        collectFlow(viewModel.channelData) {
            with(binding) {

                channelNameText.text = it.name
                Glide.with(mContext)
                    .load(it.profileImgUrl)
                    .into(imageBg)
                Glide.with(mContext)
                    .load(it.profileImgUrl)
                    .into(avatar)
                eyeImage.isVisible = true
                communityText.text =
                    getString(R.string.community_label).format(
                        if (it.private == true) "Private" else "Public",
                        it.members?.size ?: ""
                    )

                it.fiveUsers?.let { fiveUsers ->
                    Glide.with(mContext)
                        .load(fiveUsers[0].profileImgUrl)
                        .into(userOneImage)
                    Glide.with(mContext)
                        .load(fiveUsers[1].profileImgUrl)
                        .into(userTwoImage)
                    Glide.with(mContext)
                        .load(fiveUsers[2].profileImgUrl)
                        .into(userThreeImage)
                    Glide.with(mContext)
                        .load(fiveUsers[3].profileImgUrl)
                        .into(userFourImage)
                    Glide.with(mContext)
                        .load(fiveUsers[4].profileImgUrl)
                        .into(userFiveImage)
                    it.members?.size?.let { size ->
                        if (size >= 5)
                            usersCountText.text = "+%s".format(size - 5)
                    }
                    memberCountLayout.isVisible = true
                }
                avatar.isVisible = true
                arrowLeftImage.isVisible = true
                arrowRightImage.isVisible = true
                peopleImage.isVisible = true
                channelNameText.isVisible = true
            }
        }

        collectFlow(viewModel.errorMsg) {
            showToast(mContext, it)
        }
    }

    private inline fun <reified T> collectFlow(flow: Flow<T?>, crossinline action: (T) -> Unit) {
        if (!this.isAdded) return
        viewLifecycleOwner.lifecycleScope.launch {
            flow.flowWithLifecycle(viewLifecycleOwner.lifecycle).collect {
                action.invoke(it ?: return@collect)
            }
        }
    }
}