import {makeObservable, observable, action} from 'mobx';

class SearchStore {
    searchData = [];

    constructor() {
        makeObservable(this, {
            searchData: observable,
            addSearchData: action,
        });
    }

    addSearchData = data => {
        const updatedSearchData = [
            ...new Set([...this.searchData, data]),
        ].slice(-6);
        
        this.searchData = updatedSearchData;
    };
}

const searchStore = new SearchStore();

export default searchStore;
