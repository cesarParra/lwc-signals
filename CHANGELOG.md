### 🚀 Release Notes

**Version**: 1.2.0
**Date**: 2024-12-11

### ✨ Features

- Ability to read a signal value without subscribing to it via the `peek` function. ([8dc1db3](https://github.com/cesarParra/lwc-signals/commit/8dc1db367a24190a6746543f1c470615be0eaf3a))
- Effects and computed have a default identifier. ([74f2521](https://github.com/cesarParra/lwc-signals/commit/74f2521b7973e942c23d2879eb62dfe1e00c7600))
- Effects and computed have a default identifier. ([7db87fb](https://github.com/cesarParra/lwc-signals/commit/7db87fb2c0b3e4d82f5b553c38e3acd192b82589))
- Improved error handling ([#22](https://github.com/cesarParra/lwc-signals/issues/22)) ([8144196](https://github.com/cesarParra/lwc-signals/commit/8144196460f8067b4d4f8f9e319071b105def151))
- isASignal function allows to check if an object is a signal ([c6be621](https://github.com/cesarParra/lwc-signals/commit/c6be6210c73a06e1af4332ab76de759a5c4ad4d2))
- isASignal function allows to check if an object is a signal ([06dd95b](https://github.com/cesarParra/lwc-signals/commit/06dd95bf48a1601e1b92f070d8fe93fea645d403))
- Signals can be identified with a symbol through the "brand" property ([17f7b10](https://github.com/cesarParra/lwc-signals/commit/17f7b100b9b8e098b87293c970230997e45a91bf))

### 🐞 Bug Fixes

- Computed values that return the unchanged value of a tracked signal are now recomputed when the source signal changes. ([100308e](https://github.com/cesarParra/lwc-signals/commit/100308ef3269e685fb212cb16d44ae70144bf27d))

### 🚀 Release Notes

**Version**: 1.1.1
**Date**: 2024-11-29

### 🐞 Bug Fixes

- removing console logs. ([1e9aecf](https://github.com/cesarParra/lwc-signals/commit/1e9aecf1ff8e471119f3df2c327d214880e73387))

### 🚀 Release Notes

**Version**: 1.1.0
**Date**: 2024-11-29

### ✨ Features

- Error handling and cyclical dependency management ([#20](https://github.com/cesarParra/lwc-signals/issues/20)) ([97fa7fe](https://github.com/cesarParra/lwc-signals/commit/97fa7fe78955e744044096e384d32d4dfa5b0922))

### 🚀 Release Notes

**Version**: 1.0.2
**Date**: 2024-11-29

### 🐞 Bug Fixes

- Fix issues with equality ([fef168f](https://github.com/cesarParra/lwc-signals/commit/fef168fab4d2f1367ca1efdb2e7a8a1af7651475))

### 🚀 Release Notes

**Version**: 1.0.1
**Date**: 2024-11-26

### 🐞 Bug Fixes

- Reactive cycle improvements ([2fa354a](https://github.com/cesarParra/lwc-signals/commit/2fa354a8bd67e12773468460d61e90b47db1891d))

### 🚀 Release Notes

**Version**: 1.0.0
**Date**: 2024-11-22

### ✨ Features

- Introduces the ability to make objects and array changes reactive by "tracking" them ([8a6bdf4](https://github.com/cesarParra/lwc-signals/commit/8a6bdf46aac421a1ccdc3a31fc4af5c4c4840bd1))
