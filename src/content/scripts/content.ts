$(() => {
    // console.log('dom ready');
});

$(window).on('load', () => {
    // console.log('window load');
    let iconSwapper = new IconSwapper();
    iconSwapper.addIcons();
});

class IconGenerator {
    iconClasses: { approved: string; none: string; waiting: string; rejected: string; };
    iconTemplate: string;

    constructor() {
        this.iconTemplate = '<span class="tfs-cr-ext-icon icon bowtie-icon bowtie-status-waiting"></span>';
        this.iconClasses = {
            approved: 'bowtie-status-success',
            none: 'bowtie-status-waiting',
            waiting: 'bowtie-math-minus-circle',
            rejected: 'bowtie-status-failure'
        }
    }

    get allIconClasses() {
        return Object.values(this.iconClasses).join(' ');
    }
}

class IconDropdown {
    dropdownTemplate: any;
    clickCallback: (any) => void;
    loaded: Promise<void>;
    dropdown: string;

    constructor() {
        this.dropdown = '#tfs-cr-ext-icon-dropdown';
        this.loaded = this.loadDropdownTemplate()
            .then((template) => this.setupDropdown(template));
        this.clickCallback = () => {};       
    }

    setupDropdown(template) {
        this.dropdownTemplate = template;
        $(this.dropdownTemplate).appendTo('body');
        $('body').click(() => this.$dropdown.hide());
        this.$dropdown.click((evt) => evt.stopPropagation());
        this.$dropdown.find('li').click((evt) => {
            let $item = $(evt.target).is('li')
                ? $(evt.target)
                : $(evt.target).parents('li');
            let value = $item.data('value');
            // console.log(`clicked ${value} option`);
            this.clickCallback(value);
            this.$dropdown.hide();
        });
    }

    click(callback) {
        this.clickCallback = callback;
    }

    get $dropdown() {
        return $(this.dropdown);
    }

    loadDropdownTemplate() {
        let promise = new Promise((resolve, reject) => {
            $.get(chrome.extension.getURL('content/icon_dropdown.html'), function(data) {
                // console.log('dropdown template loaded');
                resolve(data);
            });
        });
        return promise;
    }
}

class ItemList {
    observerCallback: () => void;
    loaded: Promise<void>;
    itemListDetectionInterval: number;
    anyListItem: string;
    folderItem: string;
    fileItem: string;
    fileGridContainer: string;

    constructor() {
        this.fileGridContainer = '.files-grid-container';
        this.fileItem = '.file-item';
        this.folderItem = '.folder-item';
        this.anyListItem = [this.fileItem, this.folderItem].join(',');
        this.itemListDetectionInterval = 250;
        this.loaded = this.waitForFileListToBeReady()
            .then(() => this.setupObserve());
        this.observerCallback = () => {};
    }

    get $list() {
        return $(this.fileGridContainer);
    }

    get $items() {
        return this.$list.find(this.anyListItem);
    }

    getLongItemPath($listItem) {
        return $listItem.attr('title');        
    }

    setupObserve() {
        let observerConfig = {
            attributes: false, 
            childList: true, 
            characterData: false,
            subtree: true 
        };
        let observer = new MutationObserver(() => {
            // console.log('list modified');
            this.observerCallback();
        });
        observer.observe(this.$list[0], observerConfig);
    }

    observe(callback) {
        this.observerCallback = callback;
    }

    waitForFileListToBeReady() {
        let promise = new Promise((resolve, reject) => {
            let that = this;
            (function detector() {
                if ($(that.anyListItem).length == 0) {
                    // console.log('file list not ready yet');
                    setTimeout(detector, that.itemListDetectionInterval);
                } else {
                    // console.log('file list ready');
                    resolve();
                }
            }());
        });
        return promise;
    }
}

class IconSwapper {
    loaded: Promise<{}>;
    iconState: {};
    $lastClickedItem: any;
    iconDropdown: IconDropdown;
    iconGenerator: IconGenerator;
    itemList: ItemList;
    changeTitleContainer: string;
    extIcon: string;
    iconContainer: string;

    constructor() {
        this.iconContainer = '.grid-icon';
        this.extIcon = '.tfs-cr-ext-icon';
        this.changeTitleContainer = '.vc-change-title-link-container';
        this.itemList = new ItemList();
        this.iconGenerator = new IconGenerator();
        this.iconDropdown = new IconDropdown();
        this.iconDropdown.click((iconType) => this.swapLastClickedIcon(iconType));
        this.$lastClickedItem = undefined;
        this.iconState = {};
        this.loaded = this.loadIconState();
    }

    getChangeTitle() {
        return $(this.changeTitleContainer).text().trim();
    }

    saveIconState() {
        let titleOfChange = this.getChangeTitle();
        let toSave = {};
        toSave[titleOfChange] = this.iconState;
        // console.log('state to be saved', toSave);
        chrome.storage.local.set(toSave, () => {/*console.log('state saved', toSave);*/});
    }

    loadIconState() {
        let dependenciesLoaded = Promise.all([this.iconDropdown.loaded, this.itemList.loaded]);
        let promise = new Promise((resolve, reject) => {
            dependenciesLoaded.then(() => {
                let titleOfChange = this.getChangeTitle();
                // console.log('loading state');
                chrome.storage.local.get(titleOfChange, (states) => {
                    // console.log('state loaded', states);
                    if (states[titleOfChange] !== undefined) {
                        this.iconState = states[titleOfChange];
                    }
                    resolve(states);                
                });
            });
        });
        return promise;
    }

    swapIcon(iconType, $listItem) {
        $listItem.find(this.extIcon).removeClass(this.iconGenerator.allIconClasses);
        $listItem.find(this.extIcon).addClass(this.iconGenerator.iconClasses[iconType]);
        let longItemPath = this.itemList.getLongItemPath($listItem);
        this.iconState[longItemPath] = iconType;
        this.saveIconState();
    }

    swapLastClickedIcon(iconType) {
        this.swapIcon(iconType, this.$lastClickedItem);
    }

    addIcon($listItem) {
        let $iconContainer = $listItem.find(this.iconContainer);
        $(this.iconGenerator.iconTemplate).appendTo($iconContainer);
        let $extIcon = $iconContainer.find(this.extIcon);
        $extIcon.click((evt) => {
            // console.log('clicked icon');        
            this.iconDropdown.$dropdown.css($extIcon.offset());
            this.iconDropdown.$dropdown.show();
            this.$lastClickedItem = $listItem;
            evt.stopPropagation();
        });
    }

    addIcons() {        
        this.loaded.then(() => {
            let $listItems = this.itemList.$items;
            // console.log(`Found ${$listItems.length} items to play with`);
            $listItems.each((index, listItem) => {
                if ($(listItem).find(this.extIcon).length > 0) {
                    return;
                }
                this.addIcon($(listItem));
                let longItemPath = this.itemList.getLongItemPath($(listItem));
                let savedItemIconState = this.iconState[longItemPath]; 
                if (savedItemIconState !== undefined) {
                    this.swapIcon(savedItemIconState, $(listItem));
                }
            });
        });
        this.itemList.observe(() => this.addIcons());   
    }
}
