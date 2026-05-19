package com.stockapi.service;

import com.stockapi.dto.usuario.UsuarioRequest;
import com.stockapi.dto.usuario.UsuarioResponse;
import com.stockapi.exception.ResourceNotFoundException;
import com.stockapi.model.Usuario;
import com.stockapi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria al crear un usuario");
        }
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(request.getRol());
        usuario.setActivo(true);
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {
        Usuario usuario = findById(id);
        // Check email uniqueness only if changed
        if (!usuario.getEmail().equals(request.getEmail()) && usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setRol(request.getRol());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void eliminar(Long id) {
        String emailActual = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = findById(id);
        if (usuario.getEmail().equals(emailActual)) {
            throw new IllegalArgumentException("No podés dar de baja tu propia cuenta");
        }
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    private Usuario findById(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));
    }

    private UsuarioResponse toResponse(Usuario u) {
        UsuarioResponse r = new UsuarioResponse();
        r.setId(u.getId());
        r.setNombre(u.getNombre());
        r.setEmail(u.getEmail());
        r.setRol(u.getRol().name());
        r.setActivo(u.getActivo());
        r.setCreadoEn(u.getCreadoEn());
        return r;
    }
}
