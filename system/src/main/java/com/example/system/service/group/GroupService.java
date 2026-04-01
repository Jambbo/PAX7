package com.example.system.service.group;

import com.example.system.domain.model.Group;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

public interface GroupService {

    Group create(Group group, String ownerId);

    Group getById(Long id);

    List<Group> getAll(Jwt jwt);
    List<Group> getUserGroups(String userId);

    Group update(Long id, Group group);

    void delete(Long id);

    List<Group> getByOwner(String ownerId);

    void joinUser(Long groupId, String userId);

    void leaveUser(Long groupId, String userId);
}
