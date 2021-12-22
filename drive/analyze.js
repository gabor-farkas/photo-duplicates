const fs = require('fs');

let files = ("" + fs.readFileSync("files.jsonnl")).split("\n").map(line => JSON.parse(line));

let map = {}
files.forEach(file => {
    let key = file.name + "#" + file.size + "#" + file.md5Checksum;
    if (map[key]) {
        map[key].push(file);
    } else {
        map[key] = [file];
    }
});

let duplicateSize = 0;
let deletables = []
let duplicates = []
for (const key in map) {
    if (map[key].length < 2) {
        delete map[key];
    } else {
        for (let i = 1; i < map[key].length; i ++) {
            if (map[key][i].size) {
                duplicateSize += parseInt(map[key][i].size);
                deletables.push(map[key][i]);
            }
        }
        if (map[key][0].size > 0
             && map[key][0].fullFileExtension != 'ini') {
            let duplicate = {};
            duplicate.key = key;
            duplicate.items = map[key];
            duplicates.push(duplicate);
        }
    }
}

console.log(duplicates);
console.log(duplicateSize);

fs.writeFileSync("duplicates.jsonnl",
    duplicates.map(d => JSON.stringify(d)).join("\n"));