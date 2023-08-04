const images = {
    persona: require('./images/icon.png'),
    activity: require('./images/activity.png'),
    activity_selected: require('./images/activity_selected.png'),
    add: require('./images/add.png'),
    add_selected: require('./images/add_selected.png'),
    home: require('./images/home.png'),
    home_selected: require('./images/home_selected.png'),
    profile: require('./images/profile.png'),
    profile_selected: require('./images/profile_selected.png'),
    search: require('./images/search.png'),
    search_selected: require('./images/search_selected.png'),
    direct_message: require('./images/direct_message.png'),
    logo: require('./images/logo.png'),
    more: require('./images/more.png'),
    bookmark: require('./images/bookmark.png'),  //18 x 18
    like: require('./images/like.png'),
    comment: require('./images/comment.png'),
    commentProhibited: require('./images/comment_prohibited.png'),
    settings: require('./images/settings.png'),
    edit: require('./images/edit.png'),
    flash: require('./images/flash.png'),
    close: require('./images/close.png'),
    logoBlack: require('./images/logoBlack.png'),
    facebookLogo: require('./images/facebookLogo.png'),
    backButton: require('./images/backButton.png'),
    plusIcon: require('./images/plusIcon.png'),
    addIcon: require('./images/addIcon.png'),
    addPostMedia: require('./images/video_camera.png'),
    addPostMediaSelected: require('./images/video_camera_selected.png'),
    applied: require('./images/invite.png'),
    appliedSelected: require('./images/inviteSelected.png'),
    invite: require('./images/invite.png'),
    inviteSelected: require('./images/inviteSelected.png'),
    addPostArtist: require('./images/personaShell.png'),
    addPostArtistSelected: require('./images/persona.png'),
    addPostCollaborator: require('./images/collab-icon.png'),
    addPostCollaboratorSelected: require('./images/collab-icon-selected.png'),
    collab: require('./images/collab2.png'),
    collabSelected: require('./images/collab2Selected.png'),
    searchInputIcon: require('./images/searchInputIcon.png'),
    redHeart: require('./images/redHeart.png'),
    bookmarkWhite: require('./images/bookmarkWhite.png'),
    videoCamera: require('./images/video_camera.png'),
    videoCameraSubmitted: require('./images/video_camera_submitted.png'),
    videoCameraSubmitting: require('./images/video_camera_submitting.png'),
    write: require('./images/write.png'),
    writeSubmitted: require('./images/write_submitted.png'),
    writeSubmitting: require('./images/write_submitting.png'),
    photoCamera: require('./images/photo_camera.png'),
    photoCameraSubmitted: require('./images/photo_camera_submitted.png'),
    photoCameraSubmitting: require('./images/photo_camera_submitting.png'),
    audio: require('./images/audio.png'),
    audioSubmitted: require('./images/audioSubmitted.png'),
    audioSubmitting: require('./images/audioSubmitting.png'),
    dot: require('./images/dot.png'),
    grid: require('./images/gridIcon.png'),
    promise: require('./images/promise.png'),
    promiseSatisfied: require('./images/promiseSatisfied.png'),
    promiseProgress: require('./images/promiseProgress.png'),
    promiseProgressElab: require('./images/promiseProgress-elab.png'),
    list3: require('./images/list3.png'),
    polygon: require('./images/polygon.png'),
    opensea: require('./images/opensea.png'),
    transfersArrow: require('./images/transfers_arrow.png'),
    transfersDeposit: require('./images/transfers_deposit.png'),
    transfersWithdrawal: require('./images/transfers_withdrawal.png'),
    commentBubble: require('./images/comment_bubble.png'),
    portfolioBuy: require('./images/portfolio_buy.png'),
    portfolioDeposit: require('./images/portfolio_deposit.png'),
    portfolioWithdraw: require('./images/portfolio_withdraw.png'),
    portfolioSwap: require('./images/portfolio_swap.png'),
    portfolioWallet: require('./images/portfolio_wallet.png'),
    portfolioContract: require('./images/portfolio_contract.png'),
    portfolioOpenSea: require('./images/portfolio_opensea.png'),
    portfolioPolygonScan: require('./images/portfolio_polygonscan.png'),
    magnifyingGlass: require('./images/magnifying_glass.png'), // 20x20
    headerBackArrow: require('./images/header-back_arrow.png'), // 18x16
    headerOptions: require('./images/header-options.png'), // 4x16
    endorsementsAddBtn: require('./images/endorsements_add_btn.png'), // 12x12,
    profileMessage: require('./images/profile_message.png'),
    profileCall: require('./images/profile_call.png'),
    profileDeposit: require('./images/profile_deposit.png'),
    emptySearch: require('./images/empty_search.png'),

    walletCardBackground: require('./images/wallet_card_background.png'), // 232x116
    greenCheckbox: require('./images/green_checkbox.png'), // 12x12
    cc: 'https://persona-content-store.s3.us-east-2.amazonaws.com/AXvPWTqDMG5Y9mrJdsp0.png',

    menuItemNavArrow: require('./images/menu_item_nav_arrow.png'), // 8x14
    menuIconAccount: require('./images/menu_icon_account.png'), // 20x20
    menuIconHelp: require('./images/menu_icon_help.png'), // 20x20
    menuIconLogout: require('./images/menu_icon_logout.png'), // 19x20
    menuIconNfts: require('./images/menu_icon_nfts.png'), // 22x18
    menuIconNotifications: require('./images/menu_icon_notifications.png'), // 20x20
    menuIconPrivacy: require('./images/menu_icon_privacy.png'), // 20x22
    menuIconReport: require('./images/menu_icon_report.png'), // 21x20
    menuIconTerms: require('./images/menu_icon_terms.png'), // 18x22
    menuIconWallet: require('./images/menu_icon_wallet.png'), // 20x18

    usdc: 'https://persona-content-store.s3.us-east-2.amazonaws.com/NY4iytqOdNHywbOM2gAy.png',
    usd: 'https://d2snxo2mobtpb6.cloudfront.net/eyJidWNrZXQiOiJwZXJzb25hLWNvbnRlbnQtc3RvcmUiLCJrZXkiOiJaWGFWbmtMOHFqTnNMZFVjeDJsRS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsiZml0IjoiY29udGFpbiIsImhlaWdodCI6NzY4fSwicm90YXRlIjpudWxsfX0=',

    eth: 'https://persona-content-store.s3.us-east-2.amazonaws.com/7niJhcG0h1OoL1eVH7Y5.png',

    personaDefaultProfileUrl:
        'https://d2snxo2mobtpb6.cloudfront.net/eyJidWNrZXQiOiJwZXJzb25hLWNvbnRlbnQtc3RvcmUiLCJrZXkiOiJHb3hYVUVjZ0cyNnBhdGZiNVUzaS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsiZml0IjoiY29udGFpbiIsImhlaWdodCI6NzY4fSwicm90YXRlIjpudWxsfX0=',
    userDefaultProfileUrl:
        'https://d2snxo2mobtpb6.cloudfront.net/eyJidWNrZXQiOiJwZXJzb25hLWNvbnRlbnQtc3RvcmUiLCJrZXkiOiJkS2dtcVVaQ3hzeUU0WmppcGFDVS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsiZml0IjoiY29udGFpbiIsImhlaWdodCI6NzY4fSwicm90YXRlIjpudWxsfX0=',
};

export default images;
