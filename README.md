![atlas_logo](./media/logo.png)

# ATLAS Support for Visual Studio Code

ATLAS is a rule-based approach for malware or kill-chain analysis description. It is a way to store and share in an actionable way. For more information about ATLAS, you could check out [the Github repository](https://github.com/MALWARE-ATLAS/ATLAS).

With this extension, VSCode gains support for ATLAS rules. 

---

An ATLAS rule might contain scripts in a base64 encoded to ease storage and sharing. But this decision comes with a penalty; you must do base64 encode/decode plenty of times during development.

The most important feature of this extension is to auto-create and update scripts from the folder. Other than that, it has basic completion, hovers, and snippet.

## Installation

The extension can be installed by VSCode Marketplace directly.

## Features

### **Create and fill the scripts section**

As the name suggests, with this command, it is possible to form the scripts section automatically.

- Creates scripts section if it doesn't exist,
- Lists all Python scripts reside in the same folder with the ATLAS rule,
- Creates new keys for the new scripts,
- Syncs already exist scripts.

![createScripts](/media/createScripts.gif)

> :warning: **For now, It only supports Python scripts.**

### **Sync the scripts section**

Traverse all the keys inside the scripts section and try to get the latest version to update their record.

![syncScripts](/media/syncScripts.gif)

### **Complition Proposals**

The chain section of an ATLAS rule consists of sub-chains. On the other hand, a sub-chain can contain a couple of keys: **input**, **func**, and **expect**. 

- Possible options for **func** key reside in the core library. The extension lists all possible functions in the case of the **func** key.
- Similar to the **func** key, **expect** holds the validation functions information, and they define inside the expect library. The extension lists all possible functions in case of the **expect** key.
- An **input** key's value can be arbitrary, or with **$** charachter, it is possible to assign dynamic content and values from other sections like scripts. The extension lists sub-chains to retrieve their outputs or all possible scripts when there is a pattern: ```$scripts.```

![complitionProposals](/media/complitionProposals.gif)

### **Showing Hovers**

As described above, there are functions for **func** and **expect** keys and they all have a purpose and syntax. The extension gives information about the function below the mouse cursor.

![hover](/media/hover.gif)

While executing the **Create and fill the scripts section** or **Sync the scripts section** commands, it records those custom entry points' details. Then the extension gives information about the function below the mouse cursor.

![hoverFunc](/media/hoverFunc.gif)

### **Snippet**

The extension comes with a snippet, a basic ATLAS rule to start a new development.

![snippet](/media/snippet.gif)

---

## Issues

If you encounter an issue with the extension, feel free to create an issue or pull request!