# 🤖 Gitager

Orchestrate and manage git operations via a single Platform API

## 🤔 Why?

DevOps and Platform Engineers need to provide a consistent API for the services that they deliver.

Having a single entry point ensures that things are always provisioned the same way, no matter who (developers) or what (other systems) needs to provision things.

Gitager allows you to easily create an API that will use a git repository to track and manage all your deployments, services, teams, organizations, anything that you would like to maintain and version in source control.

Unlike modern IDP platform, gitager aims to only provide the API for the IDP. FrontEnd developers are free to build the UI/UX as they see fit.

## ⚡ Features

**Core**

- Uses git as a database
- OpenAPI schema and docs (via Scalar)
- Job scheduling
  - Recurring
  - Manual

**Planned**

- Job co-ordination (Stacks/Blueprints)
- Extensible plugin architecture
- NPM and Docker publishing
- Automated cli client
- Authentication
- Basic UI integration

## 🎁 Libraries

This would not be possible without the amazing libraries below

- [**oRPC**](https://github.com/unnoq/orpc) - Typesafe APIs made simple

- [**isomorphic git**](https://github.com/isomorphic-git/isomorphic-git) - A JS implementation of git

- [**memfs**](https://github.com/streamich/memfs) - In-Memory file system

- [**poolifier**](https://github.com/poolifier/poolifier) - NodeJS worker threads
