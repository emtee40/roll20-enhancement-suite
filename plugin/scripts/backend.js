/* 
 * Responsible for 
 *   managing the hook array singleton
 *   saving/loading any hook config changes into/from localStorage
 *   sending out hook data to the bootstrapper
 *   injecting hook patches into caught requests
 */

 function addCategoryElemToCanvasTokenRightClickMenu(name, actionType, callback) {
    return [
        {
            includes: "/editor/",
            find: "<li class='head hasSub' data-action-type='addturn'>Add Turn</li>",
            patch: `<li class='head hasSub' data-action-type='addturn'>Add Turn</li>
<li class="head hasSub" data-menuname="${actionType}"> ${name} »
<ul class="submenu" id="${actionType}" data-menuname="${actionType}" style="width: auto;display: none;">

</ul>`,
        }
    ];
}


function addElemToCanvasTokenRightClickMenu(name, actionType, callback) {
    return [
        {
            includes: "/editor/",
            find: "<li class='head hasSub' data-action-type='addturn'>Add Turn</li>",
            patch: `<li class='head hasSub' data-action-type='addturn'>Add Turn</li>
<li class='head hasSub' data-action-type='${actionType}'>${name}</li>`,
        },

        {
            includes: "assets/app.js",
            find: `else if("toback"==e)`,
            patch: `else if("${actionType}"==e) window.r20es.${callback}(n), i(), d20.token_editor.removeRadialMenu();else if("toback"==e)`
        }
    ];
}

let categories = {
    canvas: "Canvas",
    exportImport: "Exporting/Importing",
    initiative: "Initiative",
    token: "Token",
    journal: "Journal",
}

let hooks = {
    exposeD20: {
        force: true,

        includes: "assets/app.js",
        find: "var d20=d20||{};",
        patch: "var d20=d20||{};window.d20=d20;"
    },

    createFinalPageLoadEvent: {
        force: true,
        includes: "assets/app.js",

        find: `$("#loading-overlay").hide()`,
        patch: `$("#loading-overlay").hide();window.r20es.onAppLoad.fire(null);`
    },

    tokenLayerDrawing: {
        name: "Token layer drawing",
        description: "Draws an indicator at the bottom left of each token that indicates which layer it is on.",
        category: categories.canvas,
        gmOnly: true,

        includes: "assets/app.js",
        find: "this.model.view.updateBackdrops(e),this.active",
        patch: "this.model.view.updateBackdrops(e), window.is_gm && window.r20es.tokenDrawBg(e, this), this.active"
    },

    activeLayerHud: {

        name: "Display active layer",
        description: "Displays the active edit layer as well as whether the select tool is active.",
        category: categories.canvas,
        gmOnly: true,

        inject: ["draw_current_layer.js"],

        includes: "assets/app.js",
        find: "function setMode(e){",
        patch: "function setMode(e){if(window.r20es) window.r20es.setModePrologue(e);",
    },

    seenadOverride: {
        
        name: "Skip ad",
        description : "Skips loading ads",
        category: categories.canvas,

        includes: "/editor/startjs/",
        find: "d20ext.showGoogleAd();",
        patch: 'window.d20ext.seenad = !0, $("#loading-overlay").find("div").hide(), window.currentPlayer && d20.Campaign.pages.length > 0 && d20.Campaign.handlePlayerPageChanges(), void $.get("/editor/startping/true");'
    },

    characterImportExport: {
        name: "Character Exporter/Importer",
        description : "Provides character importing (in the journal) and exporting (in the journal and on sheets).",
        category: categories.exportImport,

        inject: ["character_io.js"],
    },

    autoSelectNextToken: {
        name: "Select token on its turn",
        description : "Automatically selects a token on it's turn",
        category: categories.initiative,
        gmOnly: true,

        includes: "assets/app.js",
        find: "e.push(t[0]);",
        patch: "e.push(t[0]);window.r20es.selectInitiativeToken(e[0]);"
    },

    autoFocusNextToken: {
        name: "Move camera to token on its turn",
        description : "Automatically moves the local camera to the token on it's turn. The camera movement is local only, meaning only your camera will move.",
        category: categories.initiative,
        gmOnly: true,

        includes: "assets/app.js",
        find: "e.push(t[0]);",
        patch: "e.push(t[0]);window.r20es.moveCameraTo(e[0]);"
    },

    autoPingNextToken: {
        name: "Ping tokens visible to players on their turns",
        description : "Automatically pings a token on it's turn.",
        category: categories.initiative,
        gmOnly: true,

        includes: "assets/app.js",
        find: "e.push(t[0]);",
        patch: "e.push(t[0]);window.r20es.pingInitiativeToken(e[0]);"
    },

    rollAndApplyHitDice: {
        name: "Roll and apply hit dice",
        description : `Adds a "Hit Dice" option to the token right click menu which rolls and applies hit dice for the selected tokens.`,
        category: categories.token,
        gmOnly: true,

        mods: addElemToCanvasTokenRightClickMenu("Hit Dice", "r20es-hit-dice", "rollAndApplyHitDice"),

        configView: {
            diceFormulaAttribute: {
                display: "Hit dice formula attribute",
                type: "string",
            },
            bar: {
                display: "HP Bar",
                type: "dropdown",

                dropdownValues: {
                    bar1: "Bar 1",
                    bar2: "Bar 2",
                    bar3: "Bar 3"
                },
            }
        },

        config: {
            diceFormulaAttribute: "npc_hpformula",
            bar: "bar3",
        }
    },

    bulkMacros: {
        name: "Bulk macros",
        description : `Adds a "Bulk Macros" option to the token right click menu which lists macros that can be rolled for the whole selection in bulk.`,
        category: categories.token,
        gmOnly: true,

        inject: ["bulk_macros.js"],
        mods: addCategoryElemToCanvasTokenRightClickMenu("Bulk Roll", "r20es-bulk-macro-menu", "handleBulkMacroMenuClick")
    },

    importExportTable: {
        name: "Table Import/export",
        description : "Provides rollable table importing and exporting. Supports TableExport format tables.",
        category: categories.exportImport,
        gmOnly: true,

        inject: ["import_export_table.js"],

        mods: [
            { // export buttons
                includes: "/editor/",
                find: "<button class='btn btn-danger deleterollabletable'>Delete Rollable Table</button>",
                patch: `<button class='btn r20es-table-export-json'>Export</button>
<button class='btn btn-danger deleterollabletable'>Delete Rollable Table</button>`
            },

            { // add table id to popup
                includes: "assets/app.js",
                find: `this.$el.on("click",".deleterollabletable"`,
                patch: `this.el.setAttribute("r20es-table-id", this.model.get("id")),this.$el.on("click",".deleterollabletable"`,                    
            }
        ]
    },

    duplicateInJournalContextMenu: {
        name: `"Duplicate" in journal context menu`,
        description: `Adds a "Duplicate" entry to the context menu of items found in the journal.`,
        category: categories.journal,
        gmOnly: true,

        inject: ["add_duplicate_to_journal_menu.js"],

        includes: "assets/app.js",
        find: `$("#journalitemmenu ul").on(mousedowntype,"li[data-action-type=showtoplayers]"`,
        patch: `$("#journalitemmenu ul").on(mousedowntype, "li[data-action-type=r20esduplicate]",() => {window.r20es.onJournalDuplicate($currentItemTarget.attr("data-itemid"))}),
$("#journalitemmenu ul").on(mousedowntype,"li[data-action-type=showtoplayers]"`
    },

    initiativeShortcuts: {
        name: "Initiative shortcuts",
        description: "Creates a shortcut for advancing (Ctrl+Right Arrow) in the initiative list.",
        category: categories.initiative,
        gmOnly: true,

        inject: ["initiative_shortcuts.js"],
    },

    changeRepresentsIdWhenDuplicating: {
        name: `Reassign default token "Represents" when duplicating`,
        description : `This will make sure that if a character, who we want to duplicate, has default token, the character that he default token represents will be set to the duplicated character.`,
        category: categories.token,
        gmOnly: true,

        includes: "assets/app.js",
        find: "o.defaulttoken=e.model._blobcache.defaulttoken",
        patch: `o.defaulttoken = window.r20es.replaceAll(e.model._blobcache.defaulttoken, e.model.get("id"), n.get("id"))`
    }
};

function sendHooksToPort(port) {
    port.postMessage({hooks: hooks});   
    console.log("Background sent hooks to plugin to be sent to page");
}

function sendHooksToAllPorts() {
    let idx = ports.length;

    while(idx --> 0) {
        let port = ports[idx];
        
        if(port.error) {
            console.log(`Port error: ${port.error}`);
            ports.splice(idx, 1);
            continue;
        }

        sendHooksToPort(port);
    }
}

function loadLocalStorage() {

    let get = {};

    for(let id in hooks) {
        get[id] = true;
    }
    
    browser.storage.local.get(get)
        .then(p => {
           
            for(var key in p) {
                let hook = hooks[key];
                let save = p[key];
                
                if(!hook) continue;

                let cfg = null;
                if(typeof(save) === "boolean") {
                    cfg = {enabled: true};
                } else {
                    cfg = save;
                }

                hook.config = Object.assign(hook.config, cfg); // overwrite defaults
                
                console.log(`localStorage: Loaded ${key}`);
                console.log(hook.config);
            }
        });

    
    // fill in required defaults
    for(let id in hooks) {
        let hook = hooks[id];
        
        if(!hook.config) {
            hook.config = {};
            hook.config.enabled = true;
        }
    }
}


function updateLocalStorage() {
    let save = {};

    for(let id in hooks) {
        let hook = hooks[id];
        save[id] = hook.config;
    }

    browser.storage.local.set(save);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function addModToQueueIfOk(dt, mod, queue) {
    if(mod.includes && dt.url.includes(mod.includes)) {
        queue.push(mod);
    }
}

function requestListener(dt) {

    let hookQueue = [];
    for(let id in hooks) {
        let hook = hooks[id];

        if(!hook.config.enabled) continue;

        if(hook.mods) {
            for(let mod of hook.mods) {
                addModToQueueIfOk(dt, mod, hookQueue);
            }
        } else {
            addModToQueueIfOk(dt, hook, hookQueue);
        }
    }

    if(hookQueue.length <= 0) return;

    let filter = browser.webRequest.filterResponseData(dt.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    let str = "";
    filter.ondata = event => {
        str += decoder.decode(event.data, {stream: true});
    };

    filter.onstop = _ => {
        for(let mod of hookQueue) {
            if(!mod.find || !mod.patch) continue;

            str = str.replace(new RegExp(escapeRegExp(mod.find), 'g'), mod.patch);
            console.log(`[${mod.includes}] [${mod.find}] done!`);

        }

        filter.write(encoder.encode(str));
        filter.close();
    };
}

loadLocalStorage();
let ports = [];

browser.runtime.onConnect.addListener(port => {
    console.log("Background established new port");

    ports.push(port);

    port.onMessage.addListener(e => {
        if(e.request && e.request === "hooks")
            sendHooksToPort(port)
    });
});

browser.runtime.onMessage.addListener((msg) => {
    if(msg.background) {
        if(msg.background.type === "get_hooks") {
            browser.runtime.sendMessage(null, {
                popup: {hooks: hooks, type: "receive_hooks"}
            });
        }
        if(msg.background.type === "update_hook_config") {
            let hook = hooks[msg.background.hookId];
            
            hook.config = Object.assign(hook.config, msg.background.config);
            console.log(hook.config);

            updateLocalStorage();
            sendHooksToAllPorts();
        }
    }
});

browser.webRequest.onBeforeRequest.addListener(
    requestListener,
    {urls: ["*://app.roll20.net/*"]},
    ["blocking"]);

console.log("r20es Background hook script initialized");