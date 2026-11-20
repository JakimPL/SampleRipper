import { defineRailway, github, project, service, volume } from "railway/iac";

// A named partial manages only what this file declares; the Postgres service stays as Railway made it.
export const partial = "SampleRipper";

export default defineRailway(() => {
  const library = volume("sampleripper-volume", {
    region: "europe-west4-drams3a",
    sizeMB: 50000,
  });

  const site = service("SampleRipper", {
    source: github("JakimPL/SampleRipper", { branch: "main", checkSuites: false }),
    build: {
      buildEnvironment: "V3",
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
      watchPatterns: [
        "Dockerfile",
        "docker/site.toml",
        "pyproject.toml",
        "uv.lock",
        "hatch_build.py",
        "README.md",
        "src/**",
        "frontend/**",
      ],
    },
    healthcheck: "/api/health",
    healthcheckTimeout: 300,
    replicas: { "europe-west4-drams3a": 1 },
    deploy: {
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10,
      limitOverride: { containers: { cpu: 16, memoryBytes: 16000000000 } },
    },
    domains: ["sampleripper.jakim.it"],
    networking: { privateNetworkEndpoint: "sampleripper" },
    volumeMounts: { "/library": library },
  });

  return project("sample-ripper", {
    variables: { managed: false },
    resources: [site, library],
  });
});
