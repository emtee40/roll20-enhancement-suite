import MakeConfig from '../MakeConfig';
import Category from '../Category';
import ConfigViews from '../../utils/ConfigViews';

export default MakeConfig(__dirname, {
    id: "rememberTextToolSettings",
    name: "Remember Text Tool Settings",
    description: "Remembers the last used settings for the text tool.",
    category: Category.canvas,

    config: {
        copyTextSettingsOnSelect: false,
        color: "rgb(0,0,0)",
        size: 16,
        font: "Arial",
    },

    configView: {
        copyTextSettingsOnSelect: {
            display: "Mirror selected text settings?",
            type: ConfigViews.Checkbox,
        },

        color: {
            display: "Current Text Color",
            type: ConfigViews.Text,
        },

        size: {
            display: "Current Text Size",
            type: ConfigViews.Number,
        },

        font: {
            display: "Current Text Font",
            type: ConfigViews.Text,
        },
    },


    mods: [
        {
            includes: "assets/app.js",
            find: `"text"==t.type&&(console.log(t.model.get("font_size"))`,
            patch: `if(!window.r20es || window.r20es.copyTextSettingsOnSelect) >>R20ES_MOD_FIND>>`
        },
        {
            includes: "assets/app.js",
            find: `$("#font-size").val(r).trigger("keyup"),$("#font-color").val(s).trigger("change-silent"),$("#font-family").val(a);`,
            patch: `if(!window.r20es || window.r20es.copyTextSettingsOnSelect) { >>R20ES_MOD_FIND>> }`
        }
    ]
});
