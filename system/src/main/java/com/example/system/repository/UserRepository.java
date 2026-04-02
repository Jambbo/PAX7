package com.example.system.repository;

import com.example.system.domain.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    List<User> findTop5ByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String username, String firstName, String lastName);

    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    @Query("""
        SELECT u FROM User u
        ORDER BY u.createdAt DESC
    """)
    Page<User> findLatestUsers(Pageable pageable);

    List<User> findTop10ByUsernameStartingWithIgnoreCaseAndIdNotOrderByUsernameAsc(String username, String userId);
}
