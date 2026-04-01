package com.example.system.repository;

import com.example.system.domain.model.Group;
import com.example.system.domain.model.GroupPrivacy;
import com.example.system.domain.model.User;
import com.example.system.utils.UserUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class GroupRepositoryTest {

    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    public void setUp() {
        groupRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Test find by owner Id")
    public void givenGroupAndOwner_whenFindByOwnerId_thenReturnsGroups() {
        // given
        User owner = UserUtils.getJohnDoe();
        userRepository.save(owner);
        
        Group group = Group.builder()
                .name("Test Group")
                .owner(owner)
                .privacy(GroupPrivacy.PUBLIC)
                .build();
        groupRepository.save(group);
        
        // when
        List<Group> found = groupRepository.findByOwnerId(owner.getId());
        
        // then
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getName()).isEqualTo("Test Group");
    }

    @Test
    @DisplayName("Test find by privacy")
    public void givenGroups_whenFindByPrivacy_thenReturnsSpecificPrivacyGroups() {
        Group group1 = Group.builder().name("Public Group").privacy(GroupPrivacy.PUBLIC).build();
        Group group2 = Group.builder().name("Private Group").privacy(GroupPrivacy.PRIVATE).build();
        groupRepository.save(group1);
        groupRepository.save(group2);

        List<Group> found = groupRepository.findByPrivacy(GroupPrivacy.PRIVATE);

        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getName()).isEqualTo("Private Group");
    }
    
    @Test
    @DisplayName("Test exists by name")
    public void givenGroup_whenExistsByName_thenReturnsTrueIfMatch() {
        Group group = Group.builder().name("UniqueName").privacy(GroupPrivacy.PUBLIC).build();
        groupRepository.save(group);

        assertThat(groupRepository.existsByName("UniqueName")).isTrue();
        assertThat(groupRepository.existsByName("NonExistent")).isFalse();
    }

    @Test
    @DisplayName("Test exists by Id and owner Id")
    public void givenGroup_whenExistsByIdAndOwnerId_thenReturnsTrue() {
        User owner = UserUtils.getJohnDoe();
        userRepository.save(owner);
        Group group = Group.builder().name("My Group").owner(owner).build();
        groupRepository.save(group);

        assertThat(groupRepository.existsByIdAndOwnerId(group.getId(), owner.getId())).isTrue();
        assertThat(groupRepository.existsByIdAndOwnerId(group.getId(), "wrong_id")).isFalse();
    }

    @Test
    @DisplayName("Test find by members Id")
    public void givenGroupWithMembers_whenFindByMembersId_thenReturnsGroups() {
        User member = UserUtils.getJohnDoe();
        userRepository.save(member);
        
        Group group = Group.builder().name("Member Group").build();
        group.getMembers().add(member);
        groupRepository.save(group);

        Group group2 = Group.builder().name("Member Group2").build();
        group2.getMembers().add(member);
        groupRepository.save(group2);

        List<Group> found = groupRepository.findByMembers_Id(member.getId());
        
        assertThat(found).hasSize(2);
//        assertThat(found.getFirst().getName()).isEqualTo("Member Group");
    }

    @Test
    @DisplayName("Test find groups user not member of")
    public void givenMultipleGroups_whenFindGroupsUserNotMemberOf_thenReturnsUnjoinedGroups() {
        User user1 = UserUtils.getJohnDoe();
        User user2 = UserUtils.getJaneDoe();
        userRepository.save(user1);
        userRepository.save(user2);

        Group joinedGroup = Group.builder().name("Joined Group").build();
        joinedGroup.getMembers().add(user1);
        groupRepository.save(joinedGroup);

        Group unjoinedGroup = Group.builder().name("Unjoined Group").build();
        unjoinedGroup.getMembers().add(user2); // user1 is not here
        groupRepository.save(unjoinedGroup);

        List<Group> obtainedGroups = groupRepository.findGroupsUserNotMemberOf(user1.getId());

        assertThat(obtainedGroups).hasSize(1);
        assertThat(obtainedGroups.getFirst().getName()).isEqualTo("Unjoined Group");
    }
}
