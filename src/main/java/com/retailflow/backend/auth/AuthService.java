package com.retailflow.backend.auth;

import com.retailflow.backend.auth.dto.AuthResponse;
import com.retailflow.backend.auth.dto.LoginRequest;
import com.retailflow.backend.auth.dto.RegisterOwnerRequest;
import com.retailflow.backend.tenant.Tenant;
import com.retailflow.backend.tenant.TenantRepository;
import com.retailflow.backend.user.AppUser;
import com.retailflow.backend.user.UserRepository;
import com.retailflow.backend.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse registerOwner(RegisterOwnerRequest request) {
        Tenant tenant = tenantRepository.findBySlug(request.getTenantSlug().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new RuntimeException("Email already exists");
        }

        AppUser user = AppUser.builder()
                .tenant(tenant)
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.OWNER)
                .enabled(true)
                .build();

        AppUser savedUser = userRepository.save(user);

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .tenantId(tenant.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .message("Owner registered successfully")
                .token(jwtService.generateToken(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("User account is disabled");
        }

        return AuthResponse.builder()
                .userId(user.getId())
                .tenantId(user.getTenant().getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .message("Login successful")
                .token(jwtService.generateToken(user))
                .build();
    }
}
