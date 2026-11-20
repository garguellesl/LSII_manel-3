import java.io.Console;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** Starts the existing Compose delivery, keeping interactive credentials on this PC. */
public class StartSupabase {
    private record Validation(int exitCode, boolean missingPassword) {}

    public static void main(String[] args) {
        int result;
        try {
            result = run(args);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            System.err.println("Arranque cancelado.");
            result = 1;
        } catch (IOException failure) {
            // Never print process output or exception messages which may contain configuration values.
            System.err.println("No se pudo preparar Supabase. Comprueba Docker, el JDK y los permisos del archivo local.");
            result = 1;
        } catch (IllegalArgumentException invalid) {
            System.err.println("Argumentos invalidos. Usa --configure, --check o --project-dir RUTA.");
            result = 2;
        }
        System.exit(result);
    }

    private static int run(String[] args) throws IOException, InterruptedException {
        boolean configureOnly = false;
        boolean checkOnly = false;
        Path root = Path.of("").toAbsolutePath();
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--configure" -> configureOnly = true;
                case "--check" -> checkOnly = true;
                case "--project-dir" -> {
                    if (++i >= args.length) throw new IllegalArgumentException();
                    root = Path.of(args[i]).toAbsolutePath();
                }
                case "--help" -> {
                    System.out.println("java tooling/database/StartSupabase.java [--configure|--check] [--project-dir RUTA]");
                    return 0;
                }
                default -> throw new IllegalArgumentException();
            }
        }
        if (configureOnly && checkOnly) throw new IllegalArgumentException();
        root = root.normalize();
        if (!Files.isRegularFile(root.resolve("compose.supabase.yaml"))) {
            System.err.println("No se encuentra compose.supabase.yaml. Ejecuta desde la raiz o indica --project-dir.");
            return 2;
        }
        Path envFile = root.resolve(".env.supabase");
        if (!Files.exists(envFile)) {
            Files.copy(root.resolve("tooling/database/supabase.env.example"), envFile);
        }
        Validation validation = validate(root);
        if (validation.exitCode() != 0 && validation.missingPassword() && !checkOnly) {
            Console console = System.console();
            if (console == null) {
                System.err.println("Falta la contraseña y esta consola no permite entrada oculta. No se leera con eco.");
                System.err.println("Abre Terminal en la raiz del proyecto y ejecuta:");
                System.err.println("java tooling/database/StartSupabase.java --configure");
                return 2;
            }
            String original = Files.readString(envFile, StandardCharsets.UTF_8);
            char[] password = console.readPassword("Contraseña PostgreSQL de Supabase (se guardara solo en este PC): ");
            try {
                if (password == null || password.length == 0) {
                    System.err.println("No se ha introducido una contraseña. No se arranca la aplicacion.");
                    return 2;
                }
                savePassword(envFile, original, password);
                System.out.println("Contraseña guardada en .env.supabase, excluido de Git.");
            } finally {
                if (password != null) Arrays.fill(password, '\0');
            }
            validation = validate(root);
        }
        if (validation.exitCode() != 0) {
            System.err.println("Configuracion Supabase incompleta o invalida. Revisa .env.supabase y Docker.");
            return validation.exitCode();
        }
        if (configureOnly || checkOnly) {
            System.out.println("Configuracion Supabase valida. No se han arrancado contenedores.");
            return 0;
        }
        List<String> command = compose();
        command.addAll(List.of("up", "--build", "-d", "--wait", "--wait-timeout", "180"));
        return new ProcessBuilder(command).directory(root.toFile()).inheritIO().start().waitFor();
    }

    private static List<String> compose() {
        return new ArrayList<>(List.of("docker", "compose", "--env-file", ".env.supabase",
                "-f", "compose.supabase.yaml"));
    }

    private static Validation validate(Path root) throws IOException, InterruptedException {
        List<String> command = compose();
        command.addAll(List.of("config", "--quiet"));
        Process process = new ProcessBuilder(command).directory(root.toFile()).start();
        process.getOutputStream().close();
        if (!process.waitFor(25, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            throw new IOException();
        }
        // config --quiet does not print resolved secrets. Capture errors instead of forwarding them.
        String error = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        return new Validation(process.exitValue(),
                error.contains("SUPABASE_DB_PASSWORD") && error.contains("missing"));
    }

    static void savePassword(Path file, String expectedContent, char[] password) throws IOException {
        if (!Files.readString(file, StandardCharsets.UTF_8).equals(expectedContent)) {
            throw new IOException(); // The user edited this file while the prompt was open.
        }
        String secret = new String(password);
        if (secret.indexOf('\r') >= 0 || secret.indexOf('\n') >= 0 || secret.indexOf('\0') >= 0) {
            throw new IOException();
        }
        String quoted = secret.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("$", "$$").replace("\t", "\\t");
        String separator = expectedContent.contains("\r\n") ? "\r\n" : "\n";
        List<String> lines = new ArrayList<>();
        expectedContent.lines().filter(line -> !line.matches("\\s*(export\\s+)?SUPABASE_DB_PASSWORD\\s*=.*"))
                .forEach(lines::add);
        lines.add("SUPABASE_DB_PASSWORD=\"" + quoted + "\"");
        Path temporary = Files.createTempFile(file.toAbsolutePath().getParent(), ".env.supabase.", ".tmp");
        try {
            if (Files.getFileStore(temporary).supportsFileAttributeView("posix")) {
                Files.setPosixFilePermissions(temporary, PosixFilePermissions.fromString("rw-------"));
            }
            Files.writeString(temporary, String.join(separator, lines) + separator, StandardCharsets.UTF_8);
            try {
                Files.move(temporary, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException unsupported) {
                Files.move(temporary, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(temporary);
        }
    }
}
