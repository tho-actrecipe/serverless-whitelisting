"use strict";

const PLUGIN_NAME = "serverless-whitelisting";

const BASE_POLICY = {
    Effect: "Allow",
    Principal: "*",
    Action: "execute-api:Invoke"
};

const PUBLIC_RESOURCE = {
    Resource: ["execute-api:/*/*/*"]
}

class ServerlessPlugin {
    constructor(serverless, options) {
        console.log(`Starting serverless-whitelisting`);

        let config = {};

        if (serverless.service.custom && serverless.service.custom[PLUGIN_NAME]) {
            config = serverless.service.custom[PLUGIN_NAME];
        }

        const hooks = {
            "before:offline:start": () => this.createResourcePolicy(config, true), // For testing the resource policy
            "package:initialize": () => this.createResourcePolicy(config)
        };

        Object.assign(this, {
            serverless,
            options,
            hooks,
            resourcePolicy: [],
            provider: serverless.getProvider("aws")
        });
    }

    createResourcePolicy(config, inDevMode = false) {
        if (config && JSON.stringify(config) !== "{}") {
            const {stage, publicStages, privateStages, netblocks, publicPaths} = config;
            this.serverless.cli.log(`Creating resource policies for ${stage} stage`);

            // If the currently selected stage is a public stage
            if (publicStages && publicStages.length && ~publicStages.indexOf(stage)) {
                this.serverless.cli.log(
                    `Public Resource policy required for ${stage} stage`
                );
                this.resourcePolicy.push(Object.assign(PUBLIC_RESOURCE, BASE_POLICY));
            }

            // If the currently selected stage is a private stage
            if (privateStages && privateStages.length && ~privateStages.indexOf(stage)) {
                if (!netblocks) {
                    throw new Error(
                        `[${PLUGIN_NAME}]: The \`netblocks\` option is required when specifying private stages.`
                    );
                }

                let ipRanges = netblocks;
                if (!ipRanges || ipRanges.length === 0) {
                    throw new Error(
                        `[${PLUGIN_NAME}]: Could not determine IP range restriction for ${stage} stage. Please recheck your config.`
                    );
                }

                this.serverless.cli.log(
                    `Private Resource policy required for ${stage} stage`
                );

                this.resourcePolicy.push(Object.assign(
                    {
                        Resource: ["execute-api:/*/*/*"],
                        Condition: {
                            IpAddress: {
                                "aws:SourceIp": netblocks
                            }
                        }
                    },
                    BASE_POLICY
                ));
            }

            // If set publicPaths
            if (publicPaths && publicPaths.length) {
                for (let i = 0; i < publicPaths.length; i++) {
                    const policy = {
                        Resource: ["execute-api:/*/*/" + publicPaths[i]]
                    }
                    this.resourcePolicy.push(Object.assign(policy, BASE_POLICY));
                }
            }

            // Assign resource policy update
            const resourcePolicyUpdate = {
                resourcePolicy: this.resourcePolicy
            };

            if (!inDevMode) {
                try {
                    Object.assign(this.serverless.service.provider.apiGateway, resourcePolicyUpdate);
                } catch(e) {
                    Object.assign(this.serverless.service.provider, resourcePolicyUpdate);
                }
            } else {
                this.serverless.cli.log(JSON.stringify(resourcePolicyUpdate));
            }
        }
    }
}

module.exports = ServerlessPlugin;
