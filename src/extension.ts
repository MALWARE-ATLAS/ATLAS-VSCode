import * as vscode from "vscode"
import { ExtensionContext } from "vscode";

import * as yaml from "js-yaml"


var core: {[key:string]: vscode.MarkdownString} = {
    ' reverse': new vscode.MarkdownString().appendCodeblock('reverse(data: any) -> any', "python").appendMarkdown("Returns the reverse of the argument."),
    ' download_from_remote_server': new vscode.MarkdownString().appendCodeblock('download_from_remote_server(addr: str) -> bytes', "python").appendMarkdown("Downloads from the server that is passed as a argument."),
    ' file_read_bin': new vscode.MarkdownString().appendCodeblock('file_read_bin(path: str) -> bytes', "python").appendMarkdown("Performs binary file read operation."),
    ' powershell_executor': new vscode.MarkdownString().appendCodeblock('powershell_executor(script_name: tuple, \*args) -> any', "python").appendMarkdown("Executes the powershell script that is passed as a argument."),
    ' file_read_utf8': new vscode.MarkdownString().appendCodeblock('file_read_utf8(path: str) -> str', "python").appendMarkdown("Performs utf8 file read operation."),
    ' save_file_bytes': new vscode.MarkdownString().appendCodeblock('save_file_bytes(data: any, prefix: str= "") -> str', "python").appendMarkdown("Performs binary file write operation."),
    ' save_file_arr': new vscode.MarkdownString().appendCodeblock('save_file_arr(arr: List, prefix: str="output") -> bool', "python").appendMarkdown("Performs file write one by one according to the list type argument."),
    ' python_executor': new vscode.MarkdownString().appendCodeblock('python_executor(script_tuple: tuple, \*args) -> any', "python").appendMarkdown("Executes the python script that is passed as an argument."),
    ' printer': new vscode.MarkdownString().appendCodeblock('printer(\*args) -> bool', "python").appendMarkdown("Prints the arguments by joining them."),
    ' hello_world': new vscode.MarkdownString().appendCodeblock('hello_world() -> None', "python").appendMarkdown("Prints “Hello World, ATLAS.” string. Can be used as a test."),
    ' bytes_to_str_utf8': new vscode.MarkdownString().appendCodeblock('bytes_to_str_utf8(data: bytes=b"") -> str', "python").appendMarkdown("UTF8 decodes byte object."),
}

var expect: {[key:string]: vscode.MarkdownString} = {
    ' is_not_none': new vscode.MarkdownString().appendCodeblock('is_not_none(data: any) -> bool', "python").appendMarkdown("Validates whether the argument is None or not."),
    ' is_not_empty_list': new vscode.MarkdownString().appendCodeblock('is_not_empty_list(data: list) -> bool', "python").appendMarkdown("Validates whether the list type argument is not empty."),
    ' is_not_empty_dict': new vscode.MarkdownString().appendCodeblock('is_not_empty_dict(data: dict) -> bool', "python").appendMarkdown("Validates whether the dict type argument is not empty."),
    ' is_not_empty_str': new vscode.MarkdownString().appendCodeblock('is_not_empty_str(data: str) -> bool', "python").appendMarkdown("Validates whether the str type argument is not empty."),
    ' is_pe': new vscode.MarkdownString().appendCodeblock('is_pe(data: bytes) -> bool', "python").appendMarkdown("Validates whether the argument is \"application/x-dosexec\" or not.")
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
            } else if(pre_word.match(/^\s+expect\s*:\s*.+?$/g) != null) {
                let replaced = pre_word.replace(/^\s+expect\s*:\s*/g, '')
                if(expect[' ' + replaced] != null) {
                    return {
                        contents: [expect[' ' + replaced]]
                    };
                }
            } else {
                return {
                    contents: []
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
        } else if(pre_word.match(/^\s+expect\s*:\s*$/g) != null) {
            for( var i = 0; i < Object.keys(expect).length; i++ ) {
                items.push(complitionItem(Object.keys(expect)[i]))
            }

            return items
        }

        return []
    }
}