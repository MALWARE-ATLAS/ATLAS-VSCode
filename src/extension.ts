import * as vscode from "vscode"
import { ExtensionContext, MarkdownString, commands } from "vscode";

import * as fs from "fs"
import * as yaml from "js-yaml"
import * as path from "path"



var core: {[key:string]: MarkdownString} = {
    ' reverse': new MarkdownString().appendCodeblock('reverse(data: any) -> any', "python").appendMarkdown("Returns the reverse of the argument."),
    ' download_from_remote_server': new MarkdownString().appendCodeblock('download_from_remote_server(addr: str) -> bytes', "python").appendMarkdown("Downloads from the server that is passed as a argument."),
    ' file_read_bin': new MarkdownString().appendCodeblock('file_read_bin(path: str) -> bytes', "python").appendMarkdown("Performs binary file read operation."),
    ' powershell_executor': new MarkdownString().appendCodeblock('powershell_executor(script_name: tuple, \*args) -> any', "python").appendMarkdown("Executes the powershell script that is passed as a argument."),
    ' file_read_utf8': new MarkdownString().appendCodeblock('file_read_utf8(path: str) -> str', "python").appendMarkdown("Performs utf8 file read operation."),
    ' save_file_bytes': new MarkdownString().appendCodeblock('save_file_bytes(data: any, prefix: str= "") -> str', "python").appendMarkdown("Performs binary file write operation."),
    ' save_file_arr': new MarkdownString().appendCodeblock('save_file_arr(arr: List, prefix: str="output") -> bool', "python").appendMarkdown("Performs file write one by one according to the list type argument."),
    ' python_executor': new MarkdownString().appendCodeblock('python_executor(script_tuple: tuple, \*args) -> any', "python").appendMarkdown("Executes the python script that is passed as an argument."),
    ' printer': new MarkdownString().appendCodeblock('printer(\*args) -> bool', "python").appendMarkdown("Prints the arguments by joining them."),
    ' hello_world': new MarkdownString().appendCodeblock('hello_world() -> None', "python").appendMarkdown("Prints “Hello World, ATLAS.” string. Can be used as a test."),
    ' bytes_to_str_utf8': new MarkdownString().appendCodeblock('bytes_to_str_utf8(data: bytes=b"") -> str', "python").appendMarkdown("UTF8 decodes byte object."),
}

var expect: {[key:string]: MarkdownString} = {
    ' is_not_none': new MarkdownString().appendCodeblock('is_not_none(data: any) -> bool', "python").appendMarkdown("Validates whether the argument is None or not."),
    ' is_not_empty_list': new MarkdownString().appendCodeblock('is_not_empty_list(data: list) -> bool', "python").appendMarkdown("Validates whether the list type argument is not empty."),
    ' is_not_empty_dict': new MarkdownString().appendCodeblock('is_not_empty_dict(data: dict) -> bool', "python").appendMarkdown("Validates whether the dict type argument is not empty."),
    ' is_not_empty_str': new MarkdownString().appendCodeblock('is_not_empty_str(data: str) -> bool', "python").appendMarkdown("Validates whether the str type argument is not empty."),
    ' is_pe': new MarkdownString().appendCodeblock('is_pe(data: bytes) -> bool', "python").appendMarkdown("Validates whether the argument is \"application/x-dosexec\" or not.")
}

var scripts_section: {[key:string]: MarkdownString} = {}

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
            } else if(pre_word.match(/\$scripts\..+?$/g) != null) {
                let replaced = pre_word.replace(/^.*\$scripts\./g, '')
                if(scripts_section[' ' + replaced] != null) {
                    return {
                        contents: [scripts_section[' ' + replaced]]
                    };
                }
            } else if(pre_word.match(/(?<=\s+\w+\s*:\s*(\"|\')).+?(?=\1\s*)/g) != null) {
                let match = pre_word.match(/(?<=\s+)\w+(?=\s*:\s*(\"|\').+?\1\s*)/g)
                if(match && match[0] != null) {
                    if(scripts_section[' ' + match[0]] != null) {
                        return {
                            contents: [scripts_section[' ' + match[0]]]
                        };
                    }
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

    // https://stackoverflow.com/questions/54761955/vs-code-texteditoredit-does-not-insert-a-second-time
    context.subscriptions.push(
        commands.registerCommand(
            "ATLAS.syncScripts", async () => {
                if(vscode.window.activeTextEditor) {
                        let editor = vscode.window.activeTextEditor
                        var doc : any = {};
                        var dir_name = path.dirname(editor.document.uri.fsPath)
                        var scripts : string[] = [];
                        const text = editor.document.getText();
                        
                        try {
                            doc = yaml.load(text);
                            scripts = Object.keys(doc.scripts)
                            editor.edit(editBuilder => {
                                for(const element of scripts) {
                                    var data = fs.readFileSync(path.join(dir_name, element + ".py"))
                                    var content_encoded = Buffer.from(data).toString('base64');
                                    extract_func(data, element)

                                    var pattern = "(?<=\\s+" + element + "\\s*:\\s*(\"|\')).+?(?=\\1\\s*)"
                                    var re = new RegExp(pattern, "g");
                                    var match = re.exec(text)
                                    
                                    if(match && match[0] != null) {
                                        let startPos = editor.document.positionAt(match.index);
                                        let endPos = editor.document.positionAt(match.index + match[0].length);
                                        let range = new vscode.Range(startPos, endPos)
                                        editBuilder.replace(range, content_encoded)
                                    }
                                }
                            });
                        } catch (error : any) {
                            console.log(error)
                        }
                    }
                    
            })
    );

    context.subscriptions.push(
        commands.registerCommand(
            "ATLAS.createScripts", async () => {
                if(vscode.window.activeTextEditor) {
                    let editor = vscode.window.activeTextEditor
                    var doc : any = {};
                    var dir_name = path.dirname(editor.document.uri.fsPath)
                    var scripts : string[] = [];
                    var text = editor.document.getText();
                    const tab : any = editor.options.tabSize || 4

                    const EXTENSION = '.py';
                    var files = fs.readdirSync(path.dirname(vscode.window.activeTextEditor.document.uri.fsPath));
                    const targetFiles = files.filter(file => {
                        return path.extname(file).toLowerCase() === EXTENSION;
                    });
                    
                    try {
                        doc = yaml.load(text);
                        scripts = doc['scripts'] || []

                        editor.edit(editBuilder => {
                        if(scripts.length == 0) {
                            var lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                            var multi_line = "\n\nscripts: \n"
                            targetFiles.forEach(element => {
                                var file_basename : any = element.match(/^.+?(?=\.py$)/g)
                                var data = fs.readFileSync(path.join(dir_name, element))
                                var content_encoded = Buffer.from(data).toString('base64');
                                extract_func(data, file_basename)

                                multi_line += (" ".repeat(tab)) + file_basename[0] + ": \"" + content_encoded + "\"" + "\n"
                                
                            });
                            editBuilder.insert(lastLine.range.end, multi_line)
                        } else {
                            targetFiles.forEach(element => {
                                var file_basename : any = element.match(/^.+?(?=\.py$)/g)
                                var data = fs.readFileSync(path.join(dir_name, element))
                                var content_encoded = Buffer.from(data).toString('base64');
                                extract_func(data, file_basename)

                                if( file_basename && file_basename[0] != null) {
                                    if(file_basename[0] in scripts) {
                                        var pattern = "(?<=\\s+" + file_basename[0] + "\\s*:\\s*(\"|\')).+?(?=\\1\\s*)"
                                        var re = new RegExp(pattern, "g");
                                        var match = re.exec(text)
                                        
                                        if(match && match[0] != undefined) {
                                            let startPos = editor.document.positionAt(match.index);
                                            let endPos = editor.document.positionAt(match.index + match[0].length);
                                            let range = new vscode.Range(startPos, endPos)
                                            editBuilder.replace(range, content_encoded)
                                        }
                                    } else {
                                        console.log(file_basename)
                                        // https://github.com/microsoft/vscode/issues/16573
                                        var line = (" ".repeat(tab)) + file_basename[0] + ": \"" + content_encoded + "\"" + "\n"
                                        var pattern = "(?<=scripts\s*:\\s*)."
                                        var re = new RegExp(pattern, "g");
                                        var match = re.exec(text)

                                        if(match && match[0] != null) {
                                            let startPos = editor.document.positionAt(match.index);
                                            editBuilder.insert(startPos, line)
                                        }
                                    }
                                }
                            });
                        }
                        });
                    } catch (error : any) {
                        console.log(error)
                    }
                }
            })
    );


    let extract_func = async (data:Buffer, file_basename:string) => {
        var data_str = data.toString()
        const pattern = "(?<=\\s*def\\s+).*" + file_basename + ".+"
        const pattern2 = "(?<=\\s*def\\s+).*run.+"
        var re = new RegExp(pattern, "g");
        var match = re.exec(data_str)

        if(match && match[0] != undefined) {
            scripts_section[' ' + file_basename] = new MarkdownString().appendCodeblock(match[0], "python")
        } else {
            var re2 = RegExp(pattern2, "g");
            var match2 = re2.exec(data_str)
            if(match2 && match2[0] != undefined) {
                scripts_section[' ' + file_basename] = new MarkdownString().appendCodeblock(match2[0], "python")
            }
        }
    }
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