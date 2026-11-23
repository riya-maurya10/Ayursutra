package com.ayursutra.security;

import com.ayursutra.entity.User;
import com.ayursutra.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        String trimmed = email != null ? email.trim() : "";
        User user = userRepository.findByEmailIgnoreCase(trimmed)
                .or(() -> userRepository.findByEmail(trimmed))
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found: " + email));

        return new UserPrincipal(user);
    }
}