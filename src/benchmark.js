async function measure(fn) {
  var start = performance.now();
  await fn();
  var end = performance.now();
  console.log('Run: ', end - start);
}

async function openLevelDBForBenchmark(path) {
  op = await leveldbOptionsCreate();
  op.createIfMissing = true;
  return await leveldbOpen(op, path);
}

var runs = 1000;

async function many_rw(db) {
  var n = runs;

  po = await leveldbWriteOptionsCreate();
  go = await leveldbReadOptionsCreate();

  for (var i = 0; i < n; ++i) {
    await db.put(po, i.toString(),i.toString());
    await db.get(go, i.toString());
  }
}

async function many_wo(db) {
  var n = runs;

  po = await leveldbWriteOptionsCreate();
  for (var i = 0; i < n; ++i) {
    await db.put(po, i.toString(),i.toString());
  }
}

async function many_ro(db) {
  var n = runs;

  go = await leveldbReadOptionsCreate();
  for (var i = 0; i < n; ++i) {
    await db.get(go, i.toString());
  }
}

async function runBenchmarkChromeFS() {
  console.log('Running ChromeFS LevelDB benchmark');
  db1 = await openLevelDBForBenchmark('/chrome/test1.db')
  db2 = await openLevelDBForBenchmark('/chrome/test2.db')

  await measure(async () => {
    await many_wo(db1);
    await many_ro(db1)
    await many_rw(db2);
  });

  console.log(IOFS.profileData)
}

async function runBenchmarkIOFS() {
  console.log('Running IOFS LevelDB benchmark');
  db1 = await openLevelDBForBenchmark('/io/test1.db')
  db2 = await openLevelDBForBenchmark('/io/test2.db')

  await measure(async () => {
    await many_wo(db1);
    await many_ro(db1)
    await many_rw(db2);
  });

  console.log(IOFS.profileData)
}

async function runBenchmarkNativeIOFS() {
  console.log('Running NativeIOFS LevelDB benchmark');
  db1 = await openLevelDBForBenchmark('/nativeio/test1.db')
  db2 = await openLevelDBForBenchmark('/nativeio/test2.db')

  await measure(async () => {
    await many_wo(db1);
    await many_ro(db1)
    await many_rw(db2);
  });

  leveldbClose(db1);
  leveldbClose(db2);

  console.log(NATIVEIOFS.profileData)
}