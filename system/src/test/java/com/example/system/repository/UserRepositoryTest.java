package com.example.system.repository;

import com.example.system.domain.model.User;
import com.example.system.utils.UserUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    //before each run of this test I want to have a clean db by deleting all the data from it
    @BeforeEach
    public void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Test save user functionality")
    public void givenUserObject_whenSave_thenUserIsCreated(){
        //given
        User userToSave = UserUtils.getJohnDoe();
        //when
        User savedUser = userRepository.save(userToSave);
        //then
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getId()).isNotNull();
    }

    @Test
    @DisplayName("Test update user functionality")
    public void givenUserToUpdate_whenSave_thenEmailIsChanged(){
        //given
        String updatedEmail = "newEmail@gmail.com";
        User userToCreate = UserUtils.getJohnDoe();
        userRepository.save(userToCreate);
        //when
        User userToUpdate = userRepository.findById(userToCreate.getId())
                .orElse(null);
        userToUpdate.setEmail(updatedEmail);
        User updatedUser = userRepository.save(userToUpdate);
        //then
        assertThat(updatedUser).isNotNull();
        assertThat(updatedUser.getEmail()).isEqualTo(updatedEmail);
    }

    @Test
    @DisplayName("Test get user by id functionality")
    public void givenUserCreated_whenGetById_thenUserIsReturn(){
        //given
        User userToCreate = UserUtils.getJohnDoe();
        userRepository.save(userToCreate);
        //when
        User obtainedUser = userRepository.findById(userToCreate.getId())
                .orElse(null);
        //then
        assertThat(obtainedUser).isNotNull();
        assertThat(obtainedUser.getEmail()).isEqualTo(userToCreate.getEmail());
    }

    @Test
    @DisplayName("Test delete user functionality")
    public void givenUserCreated_whenDeleteById_thenUserIsRemoved() {
        //given
        User userToCreate = UserUtils.getJohnDoe();
        userRepository.save(userToCreate);
        //when
        userRepository.deleteById(userToCreate.getId());
        //then
        assertThat(userRepository.findById(userToCreate.getId())).isEmpty();
    }

    @Test
    @DisplayName("Test existsByUsername functionality when user exists")
    public void givenUserExists_whenExistsByUsername_thenReturnsTrue() {
        //given
        User userToCreate = UserUtils.getJohnDoe();
        userRepository.save(userToCreate);
        //when
        boolean exists = userRepository.existsByUsername(userToCreate.getUsername());
        //then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("Test existsByUsername functionality when user doesn't exist")
    public void givenUserNotExists_whenExistsByUsername_thenReturnsFalse() {
        //given
        String nonExistingUsername = "nonExisting";
        //when
        boolean exists = userRepository.existsByUsername(nonExistingUsername);
        //then
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("Test findByUsername functionality when user exists")
    public void givenUserExists_whenFindByUsername_thenReturnsUser() {
        //given
        User userToCreate = UserUtils.getJohnDoe();
        userRepository.save(userToCreate);
        //when
        User obtainedUser = userRepository.findByUsername(userToCreate.getUsername())
                .orElse(null);
        //then
        assertThat(obtainedUser).isNotNull();
        assertThat(obtainedUser.getUsername()).isEqualTo(userToCreate.getUsername());
    }

    @Test
    @DisplayName("Test findByUsername functionality when user doesn't exist")
    public void givenUserNotExists_whenFindByUsername_thenReturnsEmpty() {
        //given
        String nonExistingUsername = "nonExisting";
        //when
        java.util.Optional<User> obtainedUser = userRepository.findByUsername(nonExistingUsername);
        //then
        assertThat(obtainedUser).isEmpty();
    }


    @Test
    @DisplayName("Test findTop10ByUsernameStartingWithIgnoreCaseAndIdNotOrderByUsernameAsc functionality")
    public void givenUsersSaved_whenSearchTop10MatchingUsers_thenReturnsCorrectUsersFilteredOut() {
        //given
        User user1 = UserUtils.getJohnDoe();
        user1.setUsername("TestUser1");
        userRepository.save(user1);

        User user2 = UserUtils.getJaneDoe();
        user2.setUsername("testUser2");
        userRepository.save(user2);

        User user3 = UserUtils.getAdminUser();
        user3.setUsername("OtherUser");
        userRepository.save(user3);

        //when
        java.util.List<User> searchResults = userRepository
                .findTop10ByUsernameStartingWithIgnoreCaseAndIdNotOrderByUsernameAsc("test", user1.getId());
        
        //then
        // Should only contain testuser2, as user1 matches the ID to filter out, and user3 doesn't start with "test"
        assertThat(searchResults).hasSize(1);
        assertThat(searchResults.get(0).getUsername()).isEqualTo(user2.getUsername());
    }

}
