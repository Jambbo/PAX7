package com.example.system.rest.dto.mapper;

import com.example.system.domain.model.Group;
import com.example.system.rest.dto.group.GroupReadResponseDto;
import com.example.system.rest.dto.group.GroupWriteDto;
import org.mapstruct.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public abstract class GroupMapper {

    //write

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "members", ignore = true)
    @Mapping(target = "admins", ignore = true)
    @Mapping(target = "posts", ignore = true)
    @Mapping(target = "memberCount", ignore = true)
    @Mapping(target = "postCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    public abstract Group toEntity(GroupWriteDto dto);

    public abstract List<Group> toEntity(List<GroupWriteDto> dtos);

    public abstract void updateEntityFromDto(
            GroupWriteDto dto,
            @MappingTarget Group group
    );

    //read

    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerUsername", source = "owner.username")
    @Mapping(target = "adminIds", expression = "java(mapAdminIds(group))")
    public abstract GroupReadResponseDto toDto(Group group);

    public abstract List<GroupReadResponseDto> toDto(List<Group> groups);

    //helper

    protected Set<String> mapAdminIds(Group group) {
        if (group.getAdmins() == null) return Set.of();
        return group.getAdmins()
                .stream()
                .map(a -> a.getId())
                .collect(Collectors.toSet());
    }
}
