import * as vscode from "vscode"
import { ExtensionContext } from "vscode";

import * as yaml from "js-yaml"


var core: {[key:string]: string} = {
    ' reverse': 'Returns the reverse of the argument.',
    ' download_from_remote_server': 'Downloads from the server that is passed as a argument.',
    ' powershell_executor': 'Executes the powershell script that is passed as a argument.',
    ' file_read_bin': 'Performs binary file read operation.',
    ' file_read_utf8': 'Performs utf8 file read operation.',
    ' save_file_bytes': 'Performs binary file write operation.',
    ' save_file_arr': 'Performs file write one by one according to the list type argument.',
    ' python_executor': 'Executes the python script that is passed as an argument.',
    ' printer': 'Prints the arguments by joining them.',
    ' hello_world': 'Prints “Hello World, ATLAS.” string. Can be used as a test.',
    ' bytes_to_str_utf8': 'UTF8 decodes byte object.',
    ' get_sha256': 'Calculates sha256 checksum.'
}

export function activate(context: ExtensionContext){
    vscode.workspace.textDocuments.forEach(doc => {
        if (doc != null && doc.fileName.match(/.atl$/)) {
            vscode.languages.setTextDocumentLanguage(doc, "yaml")
        }
    })

    vscode.workspace.onDidOpenTextDocument(doc => {
        if (doc != null && doc.fileName.match(/.atl$/)) {
            vscode.languages.setTextDocumentLanguage(doc, "yaml")
        }
    })

    const ATLAS: vscode.DocumentSelector = { pattern: '**/*.atl', language: 'yaml' }

    vscode.languages.registerHoverProvider('yaml', {
        provideHover(document, position, token) {
            let pre_word = document.lineAt(position).text;
            if(pre_word.match(/^\s+func\s*:\s*.+?$/g) != null) {
                let replaced = pre_word.replace(/^\s+func\s*:\s*/g, '')
                if(core[' ' + replaced] != null) {
                    return {
                        contents: [core[' ' + replaced]]
                    };
                }
            } else {
                console.log(pre_word.replace(/^\s+func\s*:\s*/g, ''))
                if(pre_word.match(/^\s+func\s*:\s*$/g) != null) {
                    console.log("hover")
                }
                return {
                    contents: ['Hover Content']
                };
            }
        }
    });
    
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(ATLAS, new ATLASCompletionItemProvider(), '.', '$', ':')
    );

}


class ATLASCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken ) {

        let complitionItem = (text : string) => {
            let item = new vscode.CompletionItem(text, vscode.CompletionItemKind.Text);
            item.range = new vscode.Range(position, position);
            return item;
        }

        var doc : any = {};
        let items : any = []

        let pre_word = document.lineAt(position).text.substring(0, position.character);
        
        try {
            doc = yaml.load(document.getText());
          } catch (e) {
            console.log(e)
            return []
          }
        if(document.lineAt(position).text.charAt(position.character - 1) === '$' &&
        pre_word.match(/^\s+(input\s*:)|(-)\s*\$$/g) != null) {
            for(var i = 0; i < Object.keys(doc).length; i++) {
                if( Object.keys(doc)[i] === "chain" ) {
                    for(var j = 0; j < Object.keys(doc['chain']).length; j++) {
                        items.push(complitionItem(Object.keys(doc['chain'])[j]))
                    }
                } else if(Object.keys(doc)[i] === "scripts") {
                    items.push(complitionItem(Object.keys(doc)[i]))
                }
            }

            return items
        } else if(document.lineAt(position).text.charAt(position.character - 1) === '.' && 
                   pre_word.match(/^\s+(input\s*:)|(-)\s*\$scripts\.$/g) != null) {
            for( var i = 0; i < Object.keys(doc['scripts']).length; i++ ) {
                items.push(complitionItem(Object.keys(doc['scripts'])[i]))
            }

            return items
        } else if(pre_word.match(/^\s+func\s*:\s*$/g) != null) {
            for( var i = 0; i < Object.keys(core).length; i++ ) {
                items.push(complitionItem(Object.keys(core)[i]))
            }

            return items
        }

        return []
    }
}