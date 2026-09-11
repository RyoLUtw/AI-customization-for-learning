// Run with: node test-localization.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const source = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(source); // Check the complete application script, not only the data.
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('locale-zh-TW.js', 'utf8'), context);
for (const name of ['designModules', 'modules', 'vocabularyContent']) {
  const declaration = source.match(new RegExp(`    const ${name} = ([\\s\\S]*?);\\n`))[0];
  vm.runInContext(declaration, context);
}
const data = vm.runInContext('({designModules, modules, vocabularyContent, zhTW, zhTWDesign, zhTWVocabulary})', context);
let optionCount = 0;
let entryCount = 0;
for (const [key, module] of Object.entries(data.designModules)) {
  const [description, ...options] = data.zhTWDesign[key];
  assert.ok(description);
  assert.equal(options.length, module.options.length, key);
  assert.ok(data.zhTW[module.label], module.label);
  module.options.forEach((option, index) => {
    assert.ok(data.zhTW[option.label], option.label);
    assert.equal(options[index].length, 2);
    options[index].forEach(text => assert.match(text, /[\u3400-\u9fff]/u));
    optionCount++;
  });
}
for (const [module, options] of Object.entries(data.vocabularyContent)) {
  assert.deepEqual(Object.keys(data.zhTWVocabulary[module]).sort(), Object.keys(options).sort());
  for (const [key, entries] of Object.entries(options)) {
    const rows = data.zhTWVocabulary[module][key].split('\n');
    assert.equal(rows.length, entries.length, `${module}/${key}`);
    rows.forEach((row, index) => {
      const fields = row.split('|');
      assert.equal(fields.length, 2 + entries[index].examples.length, `${module}/${key}/${index}`);
      fields.forEach(field => assert.match(field, /[\u3400-\u9fff]/u));
      entryCount++;
    });
  }
}
for (const module of Object.values(data.modules)) {
  assert.ok(data.zhTW[module.label], module.label);
  module.options.forEach(option => assert.ok(data.zhTW[option.label], option.label));
}
console.log(`Localization checks passed: 5 modules, ${optionCount} options, ${entryCount} vocabulary entries and ${entryCount * 2} examples. Application syntax valid.`);
