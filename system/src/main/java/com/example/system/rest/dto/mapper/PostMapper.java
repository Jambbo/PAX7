package com.example.system.rest.dto.mapper;

import com.example.system.domain.model.Post;
import com.example.system.rest.dto.post.PostReadResponseDto;
import com.example.system.rest.dto.post.PostWriteDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public abstract class PostMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "group.id", source = "groupId")
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "images", ignore = true)
    public abstract Post toEntity(PostWriteDto dto);

    public abstract List<Post> toEntity(List<PostWriteDto> dtos);

    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorUsername", source = "author.username")
    @Mapping(target = "groupId", source = "group.id")
    @Mapping(target = "groupName", source = "group.name")
    public abstract PostReadResponseDto toDto(Post post);

    public abstract List<PostReadResponseDto> toDto(List<Post> posts);

}