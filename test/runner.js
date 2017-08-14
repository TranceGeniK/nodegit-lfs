/* global before */
const fse = require('fs-extra');
const path = require('path');
const NodeGit = require('nodegit');
const LFS = require('../build/src');

const exec = require('../build/src/utils/execHelpers').exec;
const git = require('../build/src/commands/lfsCommands').core.git;

const testLFSServer = require('./server/server');

const local = path.join.bind(path, __dirname);
const testRepoPath = local('..', 'test', 'repos');
const workdirPath = local('..', 'test', 'repos', 'workdir');
const emptyrepoPath = local('..', 'test', 'repos', 'empty');
const homePath = local('..', 'test', 'home');

before(function () {
  this.timeout(300000);
  const url = 'https://github.com/jgrosso/nodegit-lfs-test-repo';
  testLFSServer.start();
  return fse.remove(testRepoPath)
    .then(() => fse.remove(homePath))
    .then(() => fse.mkdir(local('repos')))
    .then(() => fse.mkdir(workdirPath))
    .then(() => fse.mkdir(emptyrepoPath))
    .then(() => git(`init ${emptyrepoPath}`))
    .then(() => git(`clone ${url} ${workdirPath}`))
    .then(() => fse.mkdir(homePath))
    .then(() => fse.writeFile(
      path.join(homePath, '.gitconfig'),
`[user]
    name = John Doe
    email = johndoe@example.com`
    ));
});

beforeEach(function () {
  return exec('git clean -xdf', { cwd: workdirPath })
    .then(() => exec('git checkout test', { cwd: workdirPath }))
    .then(() => exec('git reset --hard', { cwd: workdirPath }))
    .then(() => exec('git clean -xdff', { cwd: emptyrepoPath }));
});

after(function () {
  testLFSServer.stop();
});

afterEach(function () {
  const NodeGitLFS = LFS(NodeGit);
  return NodeGitLFS.LFS.unregister()
    .catch((error) => {
      // -3 implies LFS filter was not registered
      if (error.errno !== -3) { throw error; }
    });
});
