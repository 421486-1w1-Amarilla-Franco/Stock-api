package com.stockapi.config;

import com.stockapi.model.Usuario;
import com.stockapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setNombre("Administrador");
            admin.setEmail("admin@stockapi.com");
            admin.setPasswordHash(passwordEncoder.encode("Admin123"));
            admin.setRol(Usuario.Rol.ADMIN);
            admin.setActivo(true);

            usuarioRepository.save(admin);
            log.info("===========================================");
            log.info("Usuario ADMIN creado exitosamente:");
            log.info("  Email:    admin@stockapi.com");
            log.info("  Password: Admin123");
            log.info("  Cambiar la password despues del primer login");
            log.info("===========================================");
        }
    }
}
