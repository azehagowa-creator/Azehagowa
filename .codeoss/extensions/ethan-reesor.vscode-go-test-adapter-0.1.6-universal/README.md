# **DEPRECATED**

All features of this extension will be migrating to the offical Go extension.
Once `vscode-go` supports the Testing API and profiling, this extension will be
discontinued. [vscode#122208](https://github.com/microsoft/vscode/issues/122208)
tracks finalization of the Testing API and
[vscode-go#1579](https://github.com/golang/vscode-go/issues/1579) tracks
implementation of the API in the official Go extension.

# VSCode Go Test Explorer

An explorer for Go tests, based on [VS Code Test
Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer).

The Go Test Explorer supports running and debugging tests and benchmarks as well
as profiling the CPU and memory usage of benchmarks. Profiling is provided by Go
and visualization by the Go PProf tool.

![profiler screenshot](https://gitlab.com/firelizzard/vscode-go-test-adapter/-/raw/5fe67440e8dfa2be14a840e084df165d59eb3c4e/img/profiler.png)

![overview screenshot](https://gitlab.com/firelizzard/vscode-go-test-adapter/-/raw/5fe67440e8dfa2be14a840e084df165d59eb3c4e/img/overview.png)

![tooltip screenshot](https://gitlab.com/firelizzard/vscode-go-test-adapter/-/raw/5fe67440e8dfa2be14a840e084df165d59eb3c4e/img/tooltip.png)

## Dependencies

### Graphviz `dot`

The command `dot` is required to use the profiling features, as `go tool pprof` uses `dot`
to generate the diagrams that are displayed. See
[Graphviz.org](https://graphviz.org/download/) for installation instructions.

## Configuration

+ `goTestExplorer.executeParallel`
  - Enable all tests to run in parallel **(defaults to `true`)**
+ `goTestExplorer.showFiles`
  - `always` - include files in the test hierarchy **(default)**
  - `never` - list tests as direct children of packages
+ `goTestExplorer.profiler.showCodeLens`
  - Enable `cpu profile` and `memory profile` code lenses **(defaults to `true`)**

## To Do

- Update test status when debugging (running, failed, passed)
  + Unless VSCode provides some way of capturing output from a debug session,
    this would require some significant modifications

## Contributing

You'll need a VSCode development environment, and Go.

- Clone the repository: `git clone https://gitlab.com/firelizzard/vscode-go-test-adapter`
- Run `npm install` to install dependencies.
- Open the directory in VS Code.
- Run `npm run watch` or start the `watch` Task in VS Code to get the TypeScript compiler running.
- Go to the Debug section in the sidebar and run "Go Test Adapter". This will
  start a separate VS Code instance for testing the extension in. It gets
  updated code whenever "Reload Window" is run in the Command Palette.
- In the new VSCode window, titled `[Extension Development Host]`, open a Go folder with tests.

For more information and reference, review the [example
adapter](https://github.com/hbenl/vscode-example-test-adapter) as well as
adapters for other languages.
