package com.example.system.rest.dto.search;
import com.example.system.rest.dto.group.GroupReadResponseDto;
import com.example.system.rest.dto.post.PostReadResponseDto;
import com.example.system.rest.dto.user.UserReadResponseDto;
import java.util.List;
public record GlobalSearchResponseDto(
    List<UserReadResponseDto> users,
    List<GroupReadResponseDto> groups,
    List<PostReadResponseDto> posts
) {}
