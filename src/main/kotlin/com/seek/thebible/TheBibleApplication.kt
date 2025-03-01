package com.seek.thebible

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class TheBibleApplication

fun main(args: Array<String>) {
    runApplication<TheBibleApplication>(*args)
}
