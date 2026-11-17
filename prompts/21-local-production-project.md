# Diagnosticar y recuperar Production unhealthy

**Approval status:** Pending team review
**Request authorization:** chat 2026-11-17, log pegado como petición
**Approved on:** pending
**Approved by:** pending
**Used for:** diagnóstico de arranque local y configuración del proyecto Docker
**Provider:** Codex

## Prompt

Pasted text contains the user's request.

```text
#14 [build 4/7] COPY backend/src backend/src
#14 CACHED

#15 [build 7/7] RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -Pprod -DskipTests package
#15 CACHED

#16 [runtime 2/4] WORKDIR /app
#16 CACHED

#17 [runtime 3/4] RUN addgroup -S protube && adduser -S -G protube protube     && mkdir -p /media-store/imports     && chown -R protube:protube /media-store
#17 CACHED

#18 [build 5/7] COPY frontend frontend
#18 CACHED

#19 [runtime 4/4] COPY --from=build --chown=protube:protube /workspace/backend/target/protube-back-0.0.1-SNAPSHOT.jar app.jar
#19 CACHED

#20 exporting to image
#20 exporting layers done
#20 exporting manifest sha256:cff8181c252f49367bd910a221f413311e3be62316167b1cbac747c12d4e0cd1 done
#20 exporting config sha256:c1121dcb5b14cd9f957feb37968b040827db8672ba6b8806d336bc7166d517b3 done
#20 exporting attestation manifest sha256:3419fcf4de7db1aa50f4f01a4c12ebc750eddc22bc5a65d5013bc8edfa1b98d9 0.0s done
#20 exporting manifest list sha256:01ece1fcde2cd984d37e275a0e753446aa685bfdae92fd67e295273692570f22 0.0s done
#20 naming to docker.io/library/protube:local done
#20 unpacking to docker.io/library/protube:local done
#20 DONE 0.1s

#21 resolving provenance for metadata file
#21 DONE 0.0s
 Image protube:local Built 
 Container postgres_db Creating 
 Container postgres_db Created 
 Container lsii_manel-3-app-1 Creating 
 Container lsii_manel-3-app-1 Created 
 Container postgres_db Starting 
 Container postgres_db Started 
 Container postgres_db Waiting 
 Container postgres_db Healthy 
 Container lsii_manel-3-app-1 Starting 
 Container lsii_manel-3-app-1 Started 
 Container lsii_manel-3-app-1 Waiting 
 Container postgres_db Waiting 
 Container postgres_db Healthy 
container lsii_manel-3-app-1 is unhealthy
[ERROR] Command execution failed.
org.apache.commons.exec.ExecuteException: Process exited with an error: 1 (Exit value: 1)
    at org.apache.commons.exec.DefaultExecutor.executeInternal (DefaultExecutor.java:408)
    at org.apache.commons.exec.DefaultExecutor.execute (DefaultExecutor.java:306)
    at org.codehaus.mojo.exec.ExecMojo.executeCommandLine (ExecMojo.java:913)
    at org.codehaus.mojo.exec.ExecMojo.executeCommandLine (ExecMojo.java:873)
    at org.codehaus.mojo.exec.ExecMojo.execute (ExecMojo.java:464)
    at org.apache.maven.plugin.DefaultBuildPluginManager.executeMojo (DefaultBuildPluginManager.java:126)
    at org.apache.maven.lifecycle.internal.MojoExecutor.doExecute2 (MojoExecutor.java:328)
    at org.apache.maven.lifecycle.internal.MojoExecutor.doExecute (MojoExecutor.java:316)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:212)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:174)
    at org.apache.maven.lifecycle.internal.MojoExecutor.access$000 (MojoExecutor.java:75)
    at org.apache.maven.lifecycle.internal.MojoExecutor$1.run (MojoExecutor.java:162)
    at org.apache.maven.plugin.DefaultMojosExecutionStrategy.execute (DefaultMojosExecutionStrategy.java:39)
    at org.apache.maven.lifecycle.internal.MojoExecutor.execute (MojoExecutor.java:159)
    at org.apache.maven.lifecycle.internal.LifecycleModuleBuilder.buildProject (LifecycleModuleBuilder.java:105)
    at org.apache.maven.lifecycle.internal.LifecycleModuleBuilder.buildProject (LifecycleModuleBuilder.java:73)
    at org.apache.maven.lifecycle.internal.builder.singlethreaded.SingleThreadedBuilder.build (SingleThreadedBuilder.java:53)
    at org.apache.maven.lifecycle.internal.LifecycleStarter.execute (LifecycleStarter.java:118)
    at org.apache.maven.DefaultMaven.doExecute (DefaultMaven.java:261)
    at org.apache.maven.DefaultMaven.doExecute (DefaultMaven.java:173)
    at org.apache.maven.DefaultMaven.execute (DefaultMaven.java:101)
    at org.apache.maven.cli.MavenCli.execute (MavenCli.java:906)
    at org.apache.maven.cli.MavenCli.doMain (MavenCli.java:283)
    at org.apache.maven.cli.MavenCli.main (MavenCli.java:206)
    at jdk.internal.reflect.DirectMethodHandleAccessor.invoke (DirectMethodHandleAccessor.java:103)
    at java.lang.reflect.Method.invoke (Method.java:580)
    at org.codehaus.plexus.classworlds.launcher.Launcher.launchEnhanced (Launcher.java:255)
    at org.codehaus.plexus.classworlds.launcher.Launcher.launch (Launcher.java:201)
    at org.codehaus.plexus.classworlds.launcher.Launcher.mainWithExitCode (Launcher.java:361)
    at org.codehaus.plexus.classworlds.launcher.Launcher.main (Launcher.java:314)
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  20.238 s
[INFO] Finished at: 2026-11-17T13:39:24+01:00
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.codehaus.mojo:exec-maven-plugin:3.6.4:exec (default-cli) on project protube-back: Command execution failed.: Process exited with an error: 1 (Exit value: 1) -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoExecutionException

```

## Notes

La imagen se construye; el error real posterior es Flyway V5 en el volumen antiguo de otro proyecto. Conservar datos/historial y recuperar el último proyecto funcional con configuración local ignorada; no introducir repair/clean ni modificar la V5 compartida. Evidencia en specs/001-docker-delivery/tasks.md L-P1..L-P3. Sin publicación remota ni aprobación de equipo inventada.
