class REGChild extends Application{
    static ID = 'random-everything-generator';
    static TEMPLATES = {
        MAIN: `modules/${this.ID}/templates/random-everything-generator-child.hbs`
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

    constructor(title) {
      super({title: `${title} - Random Everything Generator`});
      this.Title = title;
    }

    static get defaultOptions() {
        const overrides = {
            height: 'auto',
            width: 500,
            template: REGChild.TEMPLATES.MAIN,
            resizable: true,
            minimizable: true
        }

        return foundry.utils.mergeObject(super.defaultOptions, overrides);
    }

    getData(options) {
       return {
          title: this.Title,
          xml: this.XML,
          appid: this.id,
          path: this.Path,
          markov: this.Markov
       };
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
})

