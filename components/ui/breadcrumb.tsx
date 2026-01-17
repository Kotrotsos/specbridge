"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">
                Home
            </Link>
            {items.map((item, index) => (
                <Fragment key={index}>
                    <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-gray-900 transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900 font-medium">{item.label}</span>
                    )}
                </Fragment>
            ))}
        </nav>
    );
}
