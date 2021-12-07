const STORAGE_STORIES = "stories";
const MODULE_NAME = "random-everything-generator";
class REGNoun extends FormApplication {
    Path;

    static get defaultOptions() {
        const overrides = {
            height: 200,
            width: 200,
            template: `modules/random-everything-generator/templates/noun.hbs`,
            title: 'Edit Noun',
            resizable: true,
            minimizable: true
        }

        return foundry.utils.mergeObject(super.defaultOptions, overrides);
    }

    getData(options) {
        return {
            noun: "document.RandomEverythingGeneratorData[this.Path]"
        };
    }

    async _updateObject(event, formData) {
    }
}
