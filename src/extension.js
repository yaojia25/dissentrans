const vscode = require("vscode");
const axios = require('axios').default;
const qs = require('qs');
const md5 = require('./md5');

const appid = vscode.workspace.getConfiguration('dissentrans').get('appid');
const key = vscode.workspace.getConfiguration('dissentrans').get('key');
const timeout = vscode.workspace.getConfiguration('dissentrans').get('timeout');
var salt = (new Date).getTime();

/**
 * @param {string} text
 */
async function baiduTranslate(text) {
  let str1 = appid + text + salt + key;
  var args = {
    from: 'auto',
    to: 'zh',
    appid: appid,
    salt: salt,
    sign: md5(str1),
    q: text
  };
  var header = {
   'Content-Type': 'application/x-www-form-urlencoded'
  };

  return new Promise((resolve, reject) => {
    var url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
    axios.post(url, qs.stringify(args), {headers:header})
      .then(res => {
        try {
          console.log(res)
          let list = [];
          res.data.trans_result.forEach((item) => {
            list.push(item.dst);
          });
          var trans_str = list.join(" ;");
          trans_str = trans_str.replace(/[\r\n]/g, " ");
          resolve(trans_str);
      } catch (error) {
          resolve("单词未找到释义");
      }})
      .catch(err => {
        console.log(err);
        reject(err.data);
      });
  });
}

// 缓存字典
var WordDict = new Array();
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('插件已经被激活');
  // 注册命令
  let disposable = vscode.commands.registerCommand('dissentrans.translate', async () => {
    const editor = vscode.window.activeTextEditor;
    // ignore if no file open !
    if (!editor) {
      return;
    }
    const selection = editor.selection;
    const document = editor.document;

    const textRange = selection.isEmpty ? document.getWordRangeAtPosition(selection.active) : selection;
    const text = document.getText(textRange);

    if (!text) {
      return;
    }

    let translation = "";

    if (text in WordDict) {
      translation = "$(notebook) " + WordDict[text]
    } else {
      translation = await baiduTranslate(text);
      WordDict[text] = translation;
      translation = "$(globe) " + translation
    }
    vscode.window.setStatusBarMessage(translation, timeout);
  });
  // 将命令放入其上下文对象中，使其生效
  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
  activate,
  deactivate
}
