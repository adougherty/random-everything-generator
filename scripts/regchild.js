class REGChild extends Application{
    static ID = 'random-everything-generator';
    static TEMPLATES = {
        MAIN: `modules/${this.ID}/templates/random-everything-generator-child.hbs`,
        NOUN: `modules/${this.ID}/templates/noun.hbs`
    };
    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev_mode')?.api?.getPackageDebugValue(this.ID);
        if (shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    };
    Title;
    XML;
    Path;
    Markov;
    Members = {};

    constructor(title, noun=false) {
        super({
            title: `${title} - Random Everything Generator`,
            template: (noun) ? REGChild.TEMPLATES.NOUN : REGChild.TEMPLATES.MAIN,
            height: (noun) ? '500' : 'auto'
        });
        this.Title = title;
    }

    static get defaultOptions() {
        const overrides = {
            width: 'auto',
            resizable: true,
            minimizable: true,
            editable: true
        }

        return foundry.utils.mergeObject(super.defaultOptions, overrides);
    }

    getData(options) {
        if (!this.Members.length) {
            let doc = $.parseXML(this.XML);
            let memberNodes = $(doc).find('member');
            for (const member of memberNodes) {
                this.Members[$(member).attr('include')] = $(member).attr('name');
            }
            console.log(memberNodes);
        }

        return {
            title: this.Title,
            xml: this.XML,
            appid: this.id,
            path: this.Path,
            markov: this.Markov,
            data: (document.RandomEverythingGeneratorData[this.Path]) ? document.RandomEverythingGeneratorData[this.Path] : 'Hello World',
            owner: game.user.id,
            members: this.Members
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(`#${this.id}-add-member`).change(ev => this.addMember(html));
    }

    addMember(html) {
        let path = this.Path;
        let markov = this.Markov;
        let option = html.find(`#${this.id}-add-member option:selected`);
        $.ajax({
            url: `/modules/random-everything-generator/xml/${option.val()}.xml`,
            dataType: 'text',
            success: xmlStr => {
                let regChild = new REGChild(option.text())
                regChild.XML = xmlStr;
                regChild.Path = path;
                regChild.Markov = markov;
                regChild.render(true);
            }
        });
    }
}

Hooks.on('renderREGChild', (app, html, data) => {
    let saveBtn = $(`<a class="reg-save"><i class="far fa-save"></i>Save</a>`);
    saveBtn.click(ev => {
        let saveApp = new REGTitle();
        saveApp.render(true);
    });
    html.closest('.app').find('.reg-save').remove();
    let titleElement = html.closest('.app').find('.window-title');
    saveBtn.insertAfter(titleElement);

    if (!app.Path && document.RandomEverythingGeneratorData.save) {
        let delBtn = $(`<a class="reg-delete"><i class="far fa-trash-alt"></i>Delete</a>`);
        delBtn.click(ev => {
            let json = game.settings.get(MODULE_NAME, STORAGE_STORIES);
            let stories = (json) ? JSON.parse(json) : {};
            delete stories[document.RandomEverythingGeneratorData.save];
            for (child of document.getElementById('reg-select-story').childNodes) {
                if (child.value == document.RandomEverythingGeneratorData.save) {
                    child.parentNode.removeChild(child);
                }
            }
            document.RandomEverythingGeneratorData = {};
            game.settings.set(MODULE_NAME, STORAGE_STORIES, JSON.stringify(stories));
            app.close();
        });
        html.closest('.app').find('.reg-del').remove();
        delBtn.insertAfter(titleElement);
    }
})

