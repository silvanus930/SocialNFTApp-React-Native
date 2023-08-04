import {makeObservable, observable, action} from 'mobx';

class DirectMessageStore {
    modalVisible = true;

    constructor() {
        makeObservable(this, {
            modalVisible: observable,
            toggleModal: action,
        });
    }

    toggleModal = () => {
        this.modalVisible = !this.modalVisible;
    };
}

const directMessageStore = new DirectMessageStore();

export default directMessageStore;
