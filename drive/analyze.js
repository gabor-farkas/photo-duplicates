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
    }
}

deletables.sort((f1, f2) => parseInt(f2.size) - parseInt(f1.size))
console.log(deletables);
console.log(duplicateSize);