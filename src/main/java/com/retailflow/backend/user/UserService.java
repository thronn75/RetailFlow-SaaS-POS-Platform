package com.retailflow.backend.user;

import com.retailflow.backend.user.dto.CreateStaffUserRequest;
import com.retailflow.backend.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse createStaffUser(AppUser actor, CreateStaffUserRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email already exists");
        }
        if (request.getRole() == UserRole.OWNER) {
            throw new RuntimeException("Cannot create OWNER user via staff API");
        }

        AppUser user = AppUser.builder()
                .tenant(actor.getTenant())
                .fullName(request.getFullName())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .build();
        AppUser savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .tenantId(savedUser.getTenant().getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .enabled(savedUser.isEnabled())
                .build();
    }
}
